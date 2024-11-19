import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';

type TableName = keyof Database['public']['Tables'];

const SuperadminDashboard = () => {
    const supabase = useSupabaseClient<Database>();
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<TableName | null>(null);
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newRow, setNewRow] = useState<any>({});

    useEffect(() => {
        const fetchTables = async () => {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_tables');
            if (error) {
                setError(error.message);
            } else {
                setTables(data.map((row: { table_name: string }) => row.table_name));
            }
            setLoading(false);
        };

        fetchTables();
    }, [supabase]);

    const fetchTableData = async (table: TableName) => {
        setLoading(true);
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
            setError(error.message);
        } else {
            setTableData(data);
        }
        setLoading(false);
    };

    const handleTableSelect = (table: string) => {
        setSelectedTable(table as TableName);
        fetchTableData(table as TableName);
    };

    const handleDelete = async (table: TableName, id: string) => {
        setLoading(true);
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) {
            setError(error.message);
        } else {
            fetchTableData(table);
        }
        setLoading(false);
    };

    const handleAddRow = async (table: TableName) => {
        setLoading(true);
        const { error } = await supabase.from(table).insert([newRow]);
        if (error) {
            setError(error.message);
        } else {
            fetchTableData(table);
            setNewRow({});
        }
        setLoading(false);
    };

    const handleEditRow = async (table: TableName, id: string, updatedRow: any) => {
        setLoading(true);
        const { error } = await supabase.from(table).update(updatedRow).eq('id', id);
        if (error) {
            setError(error.message);
        } else {
            fetchTableData(table);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Superadmin Dashboard</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-4">Tables</h2>
                <ul className="flex flex-wrap gap-4">
                    {tables.map((table) => (
                        <li
                            key={table}
                            onClick={() => handleTableSelect(table)}
                            className="cursor-pointer bg-white p-4 rounded-lg shadow-md hover:bg-gray-200 transition duration-200"
                        >
                            {table}
                        </li>
                    ))}
                </ul>
            </div>
            {selectedTable && (
                <div>
                    <h2 className="text-2xl font-semibold mb-4">{selectedTable}</h2>
                    <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
                        <thead className="bg-gray-200">
                            <tr>
                                {tableData.length > 0 &&
                                    Object.keys(tableData[0]).map((key) => (
                                        <th key={key} className="py-2 px-4 text-left">{key}</th>
                                    ))}
                                <th className="py-2 px-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((row) => (
                                <tr key={row.id} className="border-t">
                                    {Object.entries(row).map(([key, value]) => (
                                        <td key={key} className="py-2 px-4">{String(value)}</td>
                                    ))}
                                    <td className="py-2 px-4">
                                        <button
                                            onClick={() => handleDelete(selectedTable, row.id)}
                                            className="bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition duration-200 mr-2"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => handleEditRow(selectedTable, row.id, row)}
                                            className="bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600 transition duration-200"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-6">
                        <h3 className="text-xl font-semibold mb-4">Add New Row</h3>
                        {tableData.length > 0 &&
                            Object.keys(tableData[0]).map((key) => (
                                <div key={key} className="mb-4">
                                    <label className="block text-gray-700">{key}</label>
                                    <input
                                        type="text"
                                        value={newRow[key] || ''}
                                        onChange={(e) =>
                                            setNewRow({ ...newRow, [key]: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            ))}
                        <button
                            onClick={() => handleAddRow(selectedTable)}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
                        >
                            Add Row
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperadminDashboard;