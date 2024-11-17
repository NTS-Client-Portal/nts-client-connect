import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const ManagerPanel = ({ profile }) => {
  const supabase = useSupabaseClient();
  const [teamRole, setTeamRole] = useState(profile.team_role || 'member');
  const [users, setUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Error fetching users:', error.message);
    } else {
      setUsers(data);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async () => {
    const { error } = await supabase.auth.signUp({
      email: newUserEmail,
      password: 'defaultpassword', // You might want to handle password securely
    });

    if (error) {
      console.error('Error adding user:', error.message);
    } else {
      setNewUserEmail('');
      fetchUsers();
    }
  };

  const handleDeleteUser = async (userId) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error.message);
    } else {
      fetchUsers();
    }
  };

  const handleGrantPermissions = async (userId, role) => {
    const { error } = await supabase
      .from('profiles')
      .update({ team_role: role })
      .eq('id', userId);

    if (error) {
      console.error('Error updating member role:', error.message);
    } else {
      fetchUsers();
    }
  };

  return (
    <div className="flex flex-col w-full lg:w-2/3 md:items-start justify-center gap-4 bg-stone-200 dark:text-zinc-800 px-12 pt-6 pb-12 border border-zinc-600/40 shadow-sm rounded-sm">
      <h2 className="text-2xl font-bold mb-4">Manager Panel</h2>
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-semibold">Add New User</h3>
        <div className="flex flex-col gap-2">
          <input
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            placeholder="Enter member's email"
            className="rounded w-full p-2 border border-zinc-900"
          />
          <button
            onClick={handleAddUser}
            className="body-btn"
          >
            Add User
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4 mt-6">
        <h3 className="text-xl font-semibold">Manage Users</h3>
        <ul className="space-y-2">
          {users.map((user) => (
            <li key={user.id} className="flex justify-between items-center p-2 border border-zinc-900 rounded">
              <span>{user.email} - {user.team_role}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="body-btn"
                >
                  Delete
                </button>
                <button
                  onClick={() => handleGrantPermissions(user.id, 'manager')}
                  className="body-btn"
                >
                  Make Manager
                </button>
                <button
                  onClick={() => handleGrantPermissions(user.id, 'member')}
                  className="body-btn"
                >
                  Make User
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ManagerPanel;