import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import AdminUserManagement from './AdminUserManagement';
import AdminUrlManagement from './AdminUrlManagement';

interface AdminDashboardProps {
  currentUser: { role: string } | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  return (
    <Tabs defaultValue="urls">
      <TabsList className={`grid w-full ${currentUser?.role === 'superadmin' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <TabsTrigger value="urls">URL Management</TabsTrigger>
        {currentUser?.role === 'superadmin' && (
          <TabsTrigger value="users">User Management</TabsTrigger>
        )}
      </TabsList>
      <TabsContent value="urls">
        <AdminUrlManagement />
      </TabsContent>
      {currentUser?.role === 'superadmin' && (
        <TabsContent value="users">
          <AdminUserManagement />
        </TabsContent>
      )}
    </Tabs>
  );
};

export default AdminDashboard;
