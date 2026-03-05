'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/lib/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { USERS_COLLECTION } from '@/lib/constants'
import { UserProfile } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Shield, UserCog, User, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, userProfile } = useAuthContext()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = users.filter(user => 
        user.email?.toLowerCase().includes(query) ||
        user.displayName?.toLowerCase().includes(query)
      )
      setFilteredUsers(filtered)
    }
  }, [searchQuery, users])

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION))
      const usersList = usersSnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as UserProfile[]
      setUsers(usersList)
      setFilteredUsers(usersList)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: 'admin' | 'moderator' | 'user') => {
    if (!user) return;
    const now = new Date();
    try {
      await updateDoc(doc(db, USERS_COLLECTION, userId), {
        role: newRole,
        updatedAt: now,
        updatedBy: user.uid,
        updatedDate: now,
      })
      
      toast({
        title: 'Success',
        description: `User role updated to ${newRole}`,
      })
      
      // Refresh users list
      fetchUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      })
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <Badge className="bg-red-600 text-white"><Shield className="w-3 h-3 mr-1" />Admin</Badge>
    }
    if (role === 'moderator') {
      return <Badge className="bg-blue-600 text-white"><UserCog className="w-3 h-3 mr-1" />Moderator</Badge>
    }
    return <Badge variant="secondary" className="bg-gray-200 text-gray-700"><User className="w-3 h-3 mr-1" />User</Badge>
  }

  if (loading) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="inline-block">
                <Image 
                  src="/gdg-london-logo.png" 
                  alt="DevFest London 2025" 
                  width={180}
                  height={60}
                  className="h-12 w-auto"
                />
              </Link>
              <Badge variant="secondary" className="text-sm bg-red-100 text-red-700">
                <Shield className="w-3 h-3 mr-1" />
                Admin Panel
              </Badge>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/admin">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                ← Back to Admin Dashboard
              </Button>
            </Link>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Role Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Search for users by name or email to manage their roles. Changes take effect immediately.
              </p>

              {/* Search Box */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Search for users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              {/* Users List */}
              <div className="mt-6">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                      {searchQuery ? `No users found matching "${searchQuery}"` : 'No users found'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {searchQuery ? 'Try searching with a different name or email' : 'Users will appear here once they sign up'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {searchQuery ? `Found ${filteredUsers.length}` : `Total ${filteredUsers.length}`} user{filteredUsers.length !== 1 ? 's' : ''}
                    </h3>
                    {filteredUsers.map((user) => {
                      const currentRole = user.role || 'user'
                      
                      return (
                        <Card key={user.uid} className="bg-white hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <div className="flex-1 min-w-[200px]">
                                <div className="flex items-center gap-3 mb-2">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">
                                      {user.displayName || 'No Name'}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      {user.email}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-2">
                                  {getRoleBadge(currentRole)}
                                </div>
                              </div>

                              <div className="flex gap-2 flex-wrap">
                                <Button 
                                  onClick={() => updateUserRole(user.uid, 'admin')}
                                  variant={currentRole === 'admin' ? 'default' : 'outline'}
                                  size="sm"
                                  disabled={currentRole === 'admin'}
                                  className={currentRole === 'admin' ? 'bg-red-600 hover:bg-red-700' : ''}
                                >
                                  <Shield className="w-4 h-4 mr-1" />
                                  Make Admin
                                </Button>

                                <Button 
                                  onClick={() => updateUserRole(user.uid, 'moderator')}
                                  variant={currentRole === 'moderator' ? 'default' : 'outline'}
                                  size="sm"
                                  disabled={currentRole === 'moderator'}
                                  className={currentRole === 'moderator' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                                >
                                  <UserCog className="w-4 h-4 mr-1" />
                                  Make Moderator
                                </Button>

                                <Button 
                                  onClick={() => updateUserRole(user.uid, 'user')}
                                  variant="outline"
                                  size="sm"
                                  disabled={currentRole === 'user'}
                                >
                                  Make User
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Role Definitions */}
              {!searchQuery && (
              <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Role Definitions
                </h4>
                <ul className="space-y-3 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <Shield className="w-4 h-4 mt-0.5 text-red-600" />
                    <div>
                      <strong>Admin:</strong> Full access - manage submissions, select winners, delete projects, manage user roles
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <UserCog className="w-4 h-4 mt-0.5 text-blue-600" />
                    <div>
                      <strong>Moderator:</strong> View access - can view all submissions but cannot modify them
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <User className="w-4 h-4 mt-0.5 text-gray-600" />
                    <div>
                      <strong>User:</strong> Standard access - can submit their own projects and view public gallery
                    </div>
                  </li>
                </ul>
              </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}

