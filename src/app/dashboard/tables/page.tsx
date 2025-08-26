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
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Switch,
  Tooltip
} from 'antd';
import {
  TableOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  StarOutlined
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
import { DatabaseConnection, TableInfo, TableColumn } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;

// Global filter function for TanStack Table
const globalFilterFn: FilterFn<any> = (row, columnId, value) => {
  const search = value.toLowerCase();
  return Object.values(row.original).some((val: any) => {
    if (val === null || val === undefined) return false;
    return String(val).toLowerCase().includes(search);
  });
};

export default function TablesPage() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<any[]>([]);
  const [sorting, setSorting] = useState<any[]>([]);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/connections');
      if (response.ok) {
        const data = await response.json();
        setConnections(data.filter((conn: DatabaseConnection) => conn.is_active));
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
      message.error('Failed to fetch connections');
    }
  };

  const fetchTables = async (connectionId: number) => {
    setTablesLoading(true);
    setTables([]); // Clear previous tables
    try {
      const response = await fetch(`/api/tables?connectionId=${connectionId}`);
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      } else {
        message.error('Failed to fetch tables');
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      message.error('Failed to fetch tables');
    } finally {
      setTablesLoading(false);
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
        const currentTable = schemaData.find((t: TableInfo) => t.table_name === tableName);
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

  const handleConnectionChange = (connectionId: number) => {
    setSelectedConnection(connectionId);
    setSelectedTable(null);
    setTableData([]);
    setTableColumns([]);
    fetchTables(connectionId);
  };

  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName);
    if (selectedConnection) {
      fetchTableData(selectedConnection, tableName);
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
    if (!selectedConnection || !selectedTable) return;

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
          connectionId: selectedConnection,
          table: selectedTable,
          where: { [primaryKey.column_name]: record[primaryKey.column_name] }
        }),
      });

      if (response.ok) {
        message.success('Record deleted successfully');
        fetchTableData(selectedConnection, selectedTable);
      } else {
        message.error('Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      message.error('Failed to delete record');
    }
  };

  const handleSubmit = async (values: any) => {
    if (!selectedConnection || !selectedTable) return;

    try {
      const method = editingRecord ? 'PUT' : 'POST';
      const body: any = {
        connectionId: selectedConnection,
        table: selectedTable,
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
        fetchTableData(selectedConnection, selectedTable);
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

    // Handle undefined or null data_type
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

  const handleSaveTableToSidebar = async () => {
    if (!selectedConnection || !selectedTable) {
      message.error('Please select a connection and table first');
      return;
    }

    try {
      const response = await fetch('/api/saved-table-views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connection_id: selectedConnection,
          table_name: selectedTable,
          display_name: selectedTable,
          icon: 'table'
        }),
      });

      if (response.ok) {
        message.success('Table saved to sidebar successfully');
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to save table to sidebar');
      }
    } catch (error) {
      console.error('Error saving table to sidebar:', error);
      message.error('Failed to save table to sidebar');
    }
  };

  // Create TanStack Table columns
  const columnHelper = createColumnHelper<any>();
  
  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    console.log('Creating columns with tableColumns:', tableColumns?.length || 0);
    console.log('tableData length:', tableData?.length || 0);
    
    // If no schema columns but we have data, create columns from first row
    if ((!tableColumns || !tableColumns.length) && tableData && tableData.length > 0) {
      console.log('Creating columns from data keys');
      const firstRow = tableData[0];
      const dataKeys = Object.keys(firstRow);
      console.log('Data keys found:', dataKeys);
      
      const autoColumns = dataKeys.map(key =>
        columnHelper.accessor(key, {
          id: key,
          header: key,
          cell: ({ getValue }) => {
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
          },
          enableSorting: true,
          enableColumnFilter: true,
        })
      );

      // Add actions column
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

      return [...autoColumns, actionsColumn];
    }
    
    // Use schema columns if available
    if (tableColumns && tableColumns.length > 0) {
      console.log('Creating columns from schema');
      const dataColumns: ColumnDef<any, any>[] = [];
      
      for (const col of tableColumns) {
        if (col && col.column_name) {
          console.log('Creating column for:', col.column_name);
          dataColumns.push(
            columnHelper.accessor(col.column_name, {
              id: col.column_name,
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
                  console.error('Error rendering cell:', error);
                  return <Typography.Text type="secondary">Error</Typography.Text>;
                }
              },
              enableSorting: true,
              enableColumnFilter: true,
            })
          );
        }
      }

      // Add actions column
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

      const finalColumns = [...dataColumns, actionsColumn];
      console.log('Final columns created:', finalColumns.length, finalColumns.map(c => c.id));
      return finalColumns;
    }

    // Fallback
    console.log('No columns available - showing placeholder');
    return [
      columnHelper.display({
        id: 'placeholder',
        header: 'No Data',
        cell: () => 'No columns available',
      })
    ];
  }, [tableColumns, tableData]);

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

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Table Browser
        </Title>
        <Text type="secondary">
          Browse and manage your database tables
        </Text>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <Space size="large">
          <div>
            <Text strong>Database Connection:</Text>
            <Select
              style={{ width: 200, marginLeft: 8 }}
              placeholder="Select connection"
              value={selectedConnection}
              onChange={handleConnectionChange}
            >
              {connections.map(conn => (
                <Option key={conn.id} value={conn.id!}>
                  {conn.name}
                </Option>
              ))}
            </Select>
          </div>

          {selectedConnection && (
            <div>
              <Text strong>Table:</Text>
              <Select
                style={{ width: 200, marginLeft: 8 }}
                placeholder={tablesLoading ? "Loading tables..." : "Select table"}
                value={selectedTable}
                onChange={handleTableChange}
                loading={tablesLoading}
                disabled={tablesLoading}
              >
                {tables.map(table => (
                  <Option key={table.table_name} value={table.table_name}>
                    <Space>
                      <TableOutlined />
                      {table.table_name}
                      <Tag color="orange">{table.row_count}</Tag>
                    </Space>
                  </Option>
                ))}
              </Select>
            </div>
          )}

          {selectedTable && (
            <Button
              icon={<ReloadOutlined />}
              onClick={() => selectedConnection && fetchTableData(selectedConnection, selectedTable)}
            >
              Refresh
            </Button>
          )}
        </Space>
      </Card>

      {selectedTable && (
        <Card
          title={`Table: ${selectedTable}`}
          extra={
            <Space>
              <Tooltip title="Save this table view to sidebar for quick access">
                <Button
                  icon={<StarOutlined />}
                  onClick={handleSaveTableToSidebar}
                >
                  Add Table to Sidebar
                </Button>
              </Tooltip>
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
            {tableData.length > 0 && tableColumns.length > 0 ? (
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


                {/* Debug Info */}
                <div style={{ marginBottom: 16, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4, fontSize: 12 }}>
                  <strong>Debug:</strong> Columns: {tableColumns.length}, Data: {tableData.length},
                  Table Columns: {columns.length}
                  <br />
                  <strong>Column Names:</strong> {tableColumns.map(col => col.column_name).join(', ')}
                  <br />
                  <strong>Generated Columns:</strong> {columns.map(col => col.id || 'unknown').join(', ')}
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
      )}

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
            .filter(col => !col.is_primary_key || editingRecord) // Hide primary key for new records
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