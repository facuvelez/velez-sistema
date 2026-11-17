import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2, Edit, Plus, Users, Key, Eye, EyeOff, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

interface OrphanUser {
  user_id: string;
  email: string;
  username: string;
  created_at: string;
}


export default function UserManagement() {
  const { hasRole, signUp, profile } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orphans, setOrphans] = useState<OrphanUser[]>([]);
  const [orphanRoles, setOrphanRoles] = useState<Record<string, UserRole>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [resetPasswordProfile, setResetPasswordProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'Operator' as UserRole
  });
  const [passwordResetData, setPasswordResetData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [passwordResetError, setPasswordResetError] = useState('');


  // Check if user is administrator (Supabase Auth nativo)
  const isAdministrator = () => hasRole('Administrator');

  useEffect(() => {
    console.log('UserManagement: Checking administrator status...');
    console.log('hasRole(Administrator):', hasRole('Administrator'));
    console.log('profile:', profile);
    console.log('isAdministrator():', isAdministrator());
    
    if (isAdministrator()) {
      fetchProfiles();
      fetchOrphans();
    } else {
      setLoading(false);
    }
  }, [hasRole, profile]);

  const fetchOrphans = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-list-orphans');
      if (error) {
        console.error('Error fetching orphans:', error);
        return;
      }
      setOrphans(data?.orphans ?? []);
    } catch (err) {
      console.error('Exception in fetchOrphans:', err);
    }
  };

  const handleResolveOrphan = async (userId: string, action: 'delete' | 'create_profile') => {
    const role = orphanRoles[userId] ?? 'Operator';
    if (action === 'delete' && !confirm('¿Eliminar definitivamente este usuario huérfano de auth?')) return;
    try {
      const { data, error } = await supabase.functions.invoke('admin-resolve-orphan', {
        body: { user_id: userId, action, role },
      });
      if (error || data?.error) {
        toast({ title: 'Error', description: (data?.error || error?.message) ?? 'Error', variant: 'destructive' });
        return;
      }
      toast({
        title: action === 'delete' ? 'Usuario eliminado' : 'Perfil creado',
        description: action === 'delete' ? 'Se eliminó el usuario huérfano.' : 'Se creó el perfil faltante.',
      });
      await Promise.all([fetchProfiles(), fetchOrphans()]);
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'Error inesperado', variant: 'destructive' });
    }
  };


  const fetchProfiles = async () => {
    try {
      setLoading(true);
      console.log('Fetching profiles using admin function...');
      
      // Use the new database function that works with custom authentication
      const { data, error } = await supabase.rpc('get_all_profiles_for_admin');

      console.log('Profiles query result:', { data, error });

      if (error) {
        console.error('Error fetching profiles:', error);
        toast({
          title: "Error",
          description: `Error al cargar usuarios: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      setProfiles(data || []);
      console.log('Profiles loaded successfully:', data?.length || 0, 'users');
      
      if (!data || data.length === 0) {
        toast({
          title: "Información",
          description: "No se encontraron usuarios en el sistema.",
        });
      }
    } catch (err) {
      console.error('Exception in fetchProfiles:', err);
      toast({
        title: "Error",
        description: "Error inesperado al cargar usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!formData.username.trim()) {
      setError('El nombre de usuario es requerido');
      return;
    }
    
    if (!formData.password.trim()) {
      setError('La contraseña es requerida');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      console.log('Intentando crear usuario:', formData);
      
      const { error } = await signUp(formData.username, formData.password, formData.role);
      
      console.log('Resultado signUp:', { error });
      
      if (error) {
        console.error('Error en signUp:', error);
        setError(error.message || 'Error al crear usuario');
        return;
      }

      console.log('Usuario creado exitosamente');
      
      // Show success message
      toast({
        title: "Usuario creado",
        description: "El usuario se ha creado correctamente.",
      });

      // Close modal and reset form
      setShowCreateForm(false);
      setFormData({ username: '', password: '', role: 'Operator' });
      setError('');
      
      // Refresh the users list
      await fetchProfiles();
      
    } catch (error) {
      console.error('Error inesperado:', error);
      setError('Error inesperado al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (profileId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Rol actualizado",
        description: "El rol del usuario se ha actualizado correctamente.",
      });

      fetchProfiles();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario.",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordResetError('');

    if (!passwordResetData.newPassword.trim()) {
      setPasswordResetError('La nueva contraseña es requerida');
      return;
    }

    if (passwordResetData.newPassword.length < 6) {
      setPasswordResetError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordResetData.newPassword !== passwordResetData.confirmPassword) {
      setPasswordResetError('Las contraseñas no coinciden');
      return;
    }

    if (!resetPasswordProfile) {
      setPasswordResetError('Error: No se ha seleccionado un usuario');
      return;
    }

    try {
      setLoading(true);
      
      // Reset vía edge function (usa service_role)
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          username: resetPasswordProfile.username,
          new_password: passwordResetData.newPassword,
        },
      });

      if (error) {
        console.error('Error updating password:', error);
        setPasswordResetError('Error al resetear la contraseña: ' + error.message);
        return;
      }

      if (data?.error) {
        setPasswordResetError(data.error);
        return;
      }

      toast({
        title: "Contraseña actualizada",
        description: `La contraseña del usuario ${resetPasswordProfile.username} ha sido actualizada exitosamente.`,
      });

      setShowPasswordReset(false);
      setResetPasswordProfile(null);
      setPasswordResetData({ newPassword: '', confirmPassword: '' });
      setPasswordResetError('');

    } catch (error) {
      console.error('Error resetting password:', error);
      setPasswordResetError('Error inesperado al resetear la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (profileId: string, userId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }

    try {
      // First delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (profileError) throw profileError;

      // Note: In a real app, you'd need admin privileges to delete auth users
      // This is a simplified implementation
      toast({
        title: "Usuario eliminado",
        description: "El usuario se ha eliminado correctamente.",
      });

      fetchProfiles();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario.",
        variant: "destructive",
      });
    }
  };

  if (!isAdministrator()) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <div className="space-y-2">
            <p>No tienes permisos para acceder a esta sección.</p>
            <p className="text-sm text-muted-foreground">
              Se requiere rol de Administrador para gestionar usuarios.
            </p>
            {profile && (
              <p className="text-sm text-muted-foreground">
                Tu rol actual: <strong>{profile.role}</strong>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <p>Cargando usuarios...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Gestión de Usuarios</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Administra los usuarios del sistema</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <Info className="h-6 w-6 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-sm p-4">
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-sm">Admin</p>
                    <p className="text-xs text-muted-foreground">Acceso completo: gestión de usuarios, clientes, servicios, deudas, citas y reportes.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Administración</p>
                    <p className="text-xs text-muted-foreground">Gestión de clientes, servicios, deudas, citas y reportes. Sin acceso a gestión de usuarios.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Operador</p>
                    <p className="text-xs text-muted-foreground">Acceso limitado: solo registro de servicios y ventas realizadas por el operador.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Alineador</p>
                    <p className="text-xs text-muted-foreground">Registro de servicios y ventas, más acceso completo al panel de turnos (citas).</p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="text-muted-foreground">Administra los usuarios del sistema</p>
        </div>
        
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Ingresa los datos del nuevo usuario
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Nombre de usuario"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <PasswordInput
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Contraseña"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrator">Admin</SelectItem>
                    <SelectItem value="Administracion">Administración</SelectItem>
                    <SelectItem value="Operator">Operador</SelectItem>
                    <SelectItem value="Alineador">Alineador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear Usuario</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog para resetear contraseña */}
        <Dialog open={showPasswordReset} onOpenChange={setShowPasswordReset}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resetear Contraseña</DialogTitle>
              <DialogDescription>
                Cambiar la contraseña del usuario: <strong>{resetPasswordProfile?.username}</strong>
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              {passwordResetError && (
                <Alert variant="destructive">
                  <AlertDescription>{passwordResetError}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <PasswordInput
                  id="newPassword"
                  value={passwordResetData.newPassword}
                  onChange={(e) => setPasswordResetData({ ...passwordResetData, newPassword: e.target.value })}
                  placeholder="Nueva contraseña"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <PasswordInput
                  id="confirmPassword"
                  value={passwordResetData.confirmPassword}
                  onChange={(e) => setPasswordResetData({ ...passwordResetData, confirmPassword: e.target.value })}
                  placeholder="Confirmar nueva contraseña"
                  required
                />
              </div>

              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Key className="h-4 w-4" />
                  <span className="text-sm font-medium">Información de Seguridad</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Las contraseñas están encriptadas y no pueden visualizarse. Solo es posible resetearlas.
                </p>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowPasswordReset(false);
                    setResetPasswordProfile(null);
                    setPasswordResetData({ newPassword: '', confirmPassword: '' });
                    setPasswordResetError('');
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">Resetear Contraseña</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {orphans.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-yellow-900">
              <Info className="h-4 w-4" />
              Usuarios huérfanos ({orphans.length})
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Existen en autenticación pero no tienen perfil. Creá el perfil faltante o eliminalos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {orphans.map((o) => (
              <div key={o.user_id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-md bg-background border">
                <div className="flex-1">
                  <p className="font-medium text-sm">{o.username}</p>
                  <p className="text-xs text-muted-foreground">{o.email} · {new Date(o.created_at).toLocaleDateString('es-ES')}</p>
                </div>
                <Select
                  value={orphanRoles[o.user_id] ?? 'Operator'}
                  onValueChange={(v) => setOrphanRoles((prev) => ({ ...prev, [o.user_id]: v as UserRole }))}
                >
                  <SelectTrigger className="w-full sm:w-36 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrator">Admin</SelectItem>
                    <SelectItem value="Administracion">Administración</SelectItem>
                    <SelectItem value="Operator">Operador</SelectItem>
                    <SelectItem value="Alineador">Alineador</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleResolveOrphan(o.user_id, 'create_profile')}>
                    Crear perfil
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleResolveOrphan(o.user_id, 'delete')}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>

        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            Usuarios del Sistema
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Lista de todos los usuarios registrados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {profiles.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-muted-foreground">No se encontraron usuarios</p>
              <Button onClick={fetchProfiles} variant="outline" size="sm">
                Recargar
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View - Hidden on mobile */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Fecha de Creación</TableHead>
                      <TableHead>Contraseña</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.username}</TableCell>
                        <TableCell>
                          <Select 
                            value={profile.role} 
                            onValueChange={(value) => handleUpdateRole(profile.id, value as UserRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Administrator">Admin</SelectItem>
                              <SelectItem value="Administracion">Administración</SelectItem>
                              <SelectItem value="Operator">Operador</SelectItem>
                              <SelectItem value="Alineador">Alineador</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {new Date(profile.created_at).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">••••••••</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setResetPasswordProfile(profile);
                                setShowPasswordReset(true);
                              }}
                              title="Resetear contraseña"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setResetPasswordProfile(profile);
                                setShowPasswordReset(true);
                              }}
                              title="Resetear contraseña"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(profile.id, profile.user_id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View - Visible only on mobile */}
              <div className="md:hidden space-y-3">
                {profiles.map((profile) => (
                  <Card key={profile.id} className="p-3">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm">{profile.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(profile.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground min-w-[60px]">Rol:</span>
                          <Select 
                            value={profile.role} 
                            onValueChange={(value) => handleUpdateRole(profile.id, value as UserRole)}
                          >
                            <SelectTrigger className="h-8 text-xs flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Administrator">Admin</SelectItem>
                              <SelectItem value="Administracion">Administración</SelectItem>
                              <SelectItem value="Operator">Operador</SelectItem>
                              <SelectItem value="Alineador">Alineador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground min-w-[60px]">Contraseña:</span>
                          <span className="text-xs">••••••••</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-8"
                          onClick={() => {
                            setResetPasswordProfile(profile);
                            setShowPasswordReset(true);
                          }}
                        >
                          <Key className="h-3 w-3 mr-1" />
                          Resetear
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteUser(profile.id, profile.user_id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}