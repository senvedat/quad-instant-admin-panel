'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Button,
  Space,
  Select,
  Typography,
  message,
  Spin,
  Empty,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Switch,
  Tooltip,
  Breadcrumb
} from 'antd';
import { 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  HomeOutlined,
  TableOutlined
} from '@ant-design/icons';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
  FilterFn,
} from '@tanstack/react-table';
import { useParams, useRouter } from 'next/navigation';
import { DatabaseConnection, TableColumn, SavedTableView } from '@/types';

const { Title, Text } = Typography;

// Global filter function for TanStack Table
const globalFilterFn: FilterFn<any> = (row, columnId, value) => {
  const search = value.toLowerCase();
  return Object.values(row.original).some((val: any) => {
    if (val === null || val === undefined) return false;
    return String(val).toLowerCase().includes(search);
  });
};

export default function TableViewPage() {
  const params = useParams();
  const router = useRouter();
  const tableViewId = params.id as string;

  const [tableView, setTableView] = useState<SavedTableView | null>(null);
  const [connection, setConnection] = useState<DatabaseConnection | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<any[]>([]);
  const [sorting, setSorting] = useState<any[]>([]);

  useEffect(() => {
    if (tableViewId) {
      fetchTableView();
    }
  }, [tableViewId]);

  const fetchTableView = async () => {
    try {
      const response = await fetch(`/api/saved-table-views?id=${tableViewId}`);
      if (response.ok) {
        const views = await response.json();
        const view = views.find((v: SavedTableView) => v.id === parseInt(tableViewId));
        if (view) {
          setTableView(view);
          await fetchConnection(view.connection_id);
          await fetchTableData(view.connection_id, view.table_name);
        } else {
          message.error('Table view not found');
          router.push('/dashboard');
        }
      } else {
        message.error('Failed to fetch table view');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching table view:', error);
      message.error('Failed to fetch table view');
      router.push('/dashboard');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchConnection = async (connectionId: number) => {
    try {
      const response = await fetch('/api/connections');
      if (response.ok) {
        const connections = await response.json();
        const conn = connections.find((c: DatabaseConnection) => c.id === connectionId);
        if (conn) {
          setConnection(conn);
        }
      }
    } catch (error) {
      console.error('Error fetching connection:', error);
    }
  };

  const fetchTableData = async (connectionId: number, tableName: string) => {
    setLoading(true);
    try {
      // First get table schema information
      const schemaResponse = await fetch(`/api/tables?connectionId=${connectionId}`);
      let tableSchema: TableColumn[] = [];
      
      if (schemaResponse.ok) {
        const schemaData = await schemaResponse.json();
        const currentTable = schemaData.find((t: any) => t.table_name === tableName);
        if (currentTable) {
          tableSchema = currentTable.columns || [];
        }
      }

      // Then get table data
      const dataResponse = await fetch(`/api/tables/data?connectionId=${connectionId}&table=${tableName}`);
      if (dataResponse.ok) {
        const data = await dataResponse.json();
        setTableData(data.rows || []);
        setTableColumns(tableSchema); // Use schema columns instead of API columns
        
        console.log('Table data loaded:', {
          rows: data.rows?.length || 0,
          schemaColumns: tableSchema.length,
          columnNames: tableSchema.map(col => col.column_name)
        });
      } else {
        message.error('Failed to fetch table data');
      }
    } catch (error) {
      console.error('Error fetching table data:', error);
      message.error('Failed to fetch table data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditRecord = (record: any) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDeleteRecord = async (record: any) => {
    if (!connection || !tableView) return;

    try {
      const primaryKey = tableColumns.find(col => col.is_primary_key);
      if (!primaryKey) {
        message.error('Cannot delete record: No primary key found');
        return;
      }

      const response = await fetch('/api/tables/data', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionId: connection.id,
          table: tableView.table_name,
          where: { [primaryKey.column_name]: record[primaryKey.column_name] }
        }),
      });

      if (response.ok) {
        message.success('Record deleted successfully');
        fetchTableData(connection.id!, tableView.table_name);
      } else {
        message.error('Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      message.error('Failed to delete record');
    }
  };

  const handleSubmit = async (values: any) => {
    if (!connection || !tableView) return;

    try {
      const method = editingRecord ? 'PUT' : 'POST';
      const body: any = {
        connectionId: connection.id,
        table: tableView.table_name,
        data: values
      };

      if (editingRecord) {
        const primaryKey = tableColumns.find(col => col.is_primary_key);
        if (primaryKey) {
          body.where = { [primaryKey.column_name]: editingRecord[primaryKey.column_name] };
        }
      }

      const response = await fetch('/api/tables/data', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        message.success(editingRecord ? 'Record updated successfully' : 'Record created successfully');
        setModalVisible(false);
        fetchTableData(connection.id!, tableView.table_name);
      } else {
        message.error('Failed to save record');
      }
    } catch (error) {
      console.error('Error saving record:', error);
      message.error('Failed to save record');
    }
  };

  const renderFormField = (column: TableColumn) => {
    const { column_name, data_type, is_nullable } = column;
    const required = is_nullable === 'NO' && !column.is_primary_key;
    const dataType = data_type?.toLowerCase() || 'text';

    switch (dataType) {
      case 'integer':
      case 'bigint':
      case 'smallint':
        return (
          <Form.Item
            key={column_name}
            name={column_name}
            label={column_name}
            rules={[{ required, message: `${column_name} is required` }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        );
      
      case 'boolean':
        return (
          <Form.Item
            key={column_name}
            name={column_name}
            label={column_name}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        );
      
      case 'date':
        return (
          <Form.Item
            key={column_name}
            name={column_name}
            label={column_name}
            rules={[{ required, message: `${column_name} is required` }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        );
      
      case 'text':
      case 'varchar':
      case 'character varying':
      default:
        return (
          <Form.Item
            key={column_name}
            name={column_name}
            label={column_name}
            rules={[{ required, message: `${column_name} is required` }]}
          >
            {dataType === 'text' ? <Input.TextArea /> : <Input />}
          </Form.Item>
        );
    }
  };

  // Create TanStack Table columns
  const columnHelper = createColumnHelper<any>();
  
  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    if (!tableColumns || !tableColumns.length) {
      return [
        columnHelper.display({
          id: 'placeholder',
          header: 'No Data',
          cell: () => 'No columns available',
        })
      ];
    }

    try {
      const dataColumns = tableColumns
        .filter(col => col && col.column_name) // Filter out invalid columns
        .map(col =>
          columnHelper.accessor(col.column_name, {
            header: col.column_name,
            cell: ({ getValue }) => {
              try {
                const value = getValue();
                if (value === null || value === undefined) {
                  return <Typography.Text type="secondary">NULL</Typography.Text>;
                }
                if (typeof value === 'boolean') {
                  return value ? 'true' : 'false';
                }
                if (typeof value === 'object') {
                  return JSON.stringify(value);
                }
                return String(value);
              } catch (error) {
                return <Typography.Text type="secondary">Error</Typography.Text>;
              }
            },
            enableSorting: true,
            enableColumnFilter: true,
          })
        );

      const actionsColumn = columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Space>
            <Tooltip title="View Details">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => {
                  Modal.info({
                    title: 'Record Details',
                    content: (
                      <pre style={{ maxHeight: '400px', overflow: 'auto' }}>
                        {JSON.stringify(row.original, null, 2)}
                      </pre>
                    ),
                    width: 600,
                  });
                }}
              />
            </Tooltip>
            <Tooltip title="Edit Record">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditRecord(row.original)}
              />
            </Tooltip>
            <Tooltip title="Delete Record">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: 'Delete Record',
                    content: 'Are you sure you want to delete this record?',
                    onOk: () => handleDeleteRecord(row.original),
                  });
                }}
              />
            </Tooltip>
          </Space>
        ),
      });

      return [...dataColumns, actionsColumn];
    } catch (error) {
      console.error('Error creating columns:', error);
      return [
        columnHelper.display({
          id: 'error',
          header: 'Error',
          cell: () => 'Error creating columns',
        })
      ];
    }
  }, [tableColumns]);

  // Create TanStack Table instance with error handling
  const table = useReactTable({
    data: tableData || [],
    columns: columns || [],
    state: {
      globalFilter,
      columnFilters,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn,
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  });

  if (initialLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!tableView || !connection) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Empty description="Table view not found" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item>
            <HomeOutlined />
            <span style={{ marginLeft: 8 }}>Dashboard</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <TableOutlined />
            <span style={{ marginLeft: 8 }}>Table Views</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{tableView.display_name}</Breadcrumb.Item>
        </Breadcrumb>

        <Title level={2} style={{ margin: 0 }}>
          {tableView.display_name}
        </Title>
        <Text type="secondary">
          {connection.name} → {tableView.table_name}
        </Text>
      </div>

      <Card
        title={`Table: ${tableView.table_name}`}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchTableData(connection.id!, tableView.table_name)}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddRecord}
            >
              Add Record
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          {tableData.length > 0 ? (
            <div>
              {/* Search and Filter Controls */}
              <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
                <Input
                  placeholder="Search all columns..."
                  prefix={<SearchOutlined />}
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  style={{ width: 300 }}
                  allowClear
                />
                <Typography.Text type="secondary">
                  Showing {table.getFilteredRowModel().rows.length} of {tableData.length} records
                </Typography.Text>
              </div>

              {/* TanStack Table */}
              <div style={{ overflowX: 'auto', border: '1px solid #f0f0f0', borderRadius: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id} style={{ backgroundColor: '#fafafa' }}>
                        {headerGroup.headers.map(header => (
                          <th
                            key={header.id}
                            style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              borderBottom: '1px solid #f0f0f0',
                              fontWeight: 600,
                              cursor: header.column.getCanSort() ? 'pointer' : 'default',
                              userSelect: 'none',
                              position: 'relative'
                            }}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && (
                                <span style={{ opacity: 0.5 }}>
                                  {{
                                    asc: ' ↑',
                                    desc: ' ↓',
                                  }[header.column.getIsSorted() as string] ?? ' ↕'}
                                </span>
                              )}
                              {header.column.getCanFilter() && header.id !== 'actions' && (
                                <Tooltip title="Filter column">
                                  <FilterOutlined 
                                    style={{ 
                                      fontSize: 12, 
                                      opacity: header.column.getFilterValue() ? 1 : 0.3 
                                    }} 
                                  />
                                </Tooltip>
                              )}
                            </div>
                            {header.column.getCanFilter() && header.id !== 'actions' && (
                              <div style={{ marginTop: 4 }}>
                                <Input
                                  size="small"
                                  placeholder={`Filter ${header.column.columnDef.header}...`}
                                  value={(header.column.getFilterValue() ?? '') as string}
                                  onChange={(e) => header.column.setFilterValue(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ width: '100%' }}
                                />
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map(row => (
                      <tr 
                        key={row.id}
                        style={{ 
                          borderBottom: '1px solid #f0f0f0'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fafafa';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '';
                        }}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td
                            key={cell.id}
                            style={{
                              padding: '12px 16px',
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div style={{ 
                marginTop: 16, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Typography.Text>Rows per page:</Typography.Text>
                  <Select
                    value={table.getState().pagination.pageSize}
                    onChange={(value) => table.setPageSize(value)}
                    style={{ width: 80 }}
                  >
                    {[10, 25, 50, 100].map(pageSize => (
                      <Select.Option key={pageSize} value={pageSize}>
                        {pageSize}
                      </Select.Option>
                    ))}
                  </Select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Typography.Text>
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  </Typography.Text>
                  <Space>
                    <Button
                      size="small"
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                    >
                      {'<<'}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      {'<'}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      {'>'}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                      disabled={!table.getCanNextPage()}
                    >
                      {'>>'}
                    </Button>
                  </Space>
                </div>
              </div>
            </div>
          ) : (
            <Empty description="No data found" />
          )}
        </Spin>
      </Card>

      <Modal
        title={editingRecord ? 'Edit Record' : 'Add Record'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {tableColumns
            .filter(col => !col.is_primary_key || editingRecord)
            .map(renderFormField)}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRecord ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}