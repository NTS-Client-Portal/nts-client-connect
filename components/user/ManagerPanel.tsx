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
    <div>
      <h2>Manager Panel</h2>
      <div>
        <h3>Add New User</h3>
        <input
          type="email"
          value={newUserEmail}
          onChange={(e) => setNewUserEmail(e.target.value)}
          placeholder="Enter member's email"
        />
        <button onClick={handleAddUser}>Add User</button>
      </div>
      <div>
        <h3>Manage Users</h3>
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.email} - {user.team_role}
              <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
              <button onClick={() => handleGrantPermissions(user.id, 'manager')}>Make Manager</button>
              <button onClick={() => handleGrantPermissions(user.id, 'member')}>Make User</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ManagerPanel;