import { http, HttpResponse } from 'msw'

// Mock handlers for API endpoints
export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', ({ request }) => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        organizationId: 'test-org-id',
        organization: {
          id: 'test-org-id',
          name: 'Test Organization',
          slug: 'test-org'
        }
      },
      token: 'mock-jwt-token'
    })
  }),

  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Access token required' },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'ADMIN',
      organizationId: 'test-org-id',
      organization: {
        id: 'test-org-id',
        name: 'Test Organization',
        slug: 'test-org'
      }
    })
  }),

  // Organizations endpoints
  http.get('/api/organizations', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'Access token required' },
        { status: 401 }
      )
    }

    return HttpResponse.json([
      {
        id: 'org-1',
        name: 'Organization 1',
        slug: 'org-1',
        isActive: true,
        subscriptionPlan: 'basic',
        _count: {
          users: 5,
          tasks: 20,
          locations: 8
        }
      },
      {
        id: 'org-2', 
        name: 'Organization 2',
        slug: 'org-2',
        isActive: true,
        subscriptionPlan: 'pro',
        _count: {
          users: 12,
          tasks: 45,
          locations: 15
        }
      }
    ])
  }),

  http.get('/api/organizations/:id', ({ params, request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'Access token required' },
        { status: 401 }
      )
    }

    const { id } = params

    return HttpResponse.json({
      id: id,
      name: `Organization ${id}`,
      slug: `org-${id}`,
      isActive: true,
      subscriptionPlan: 'basic',
      _count: {
        users: 5,
        tasks: 20,
        locations: 8,
        cleaningTemplates: 3,
        planningTemplates: 2
      }
    })
  }),

  // Tasks endpoints
  http.get('/api/tasks', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'Access token required' },
        { status: 401 }
      )
    }

    return HttpResponse.json([
      {
        id: 'task-1',
        title: 'Nettoyer Bureau 1',
        description: 'Nettoyage complet du bureau',
        status: 'PENDING',
        priority: 'MEDIUM',
        estimatedDuration: 60,
        scheduledDate: new Date().toISOString(),
        location: {
          id: 'loc-1',
          name: 'Bureau 1',
          floor: '1'
        },
        assignedAgent: {
          id: 'agent-1',
          name: 'Agent Test',
          email: 'agent@test.com'
        }
      },
      {
        id: 'task-2',
        title: 'Nettoyer Salle de réunion',
        description: 'Nettoyage salle de réunion',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        estimatedDuration: 45,
        scheduledDate: new Date().toISOString(),
        location: {
          id: 'loc-2',
          name: 'Salle de réunion',
          floor: '2'
        },
        assignedAgent: {
          id: 'agent-1',
          name: 'Agent Test',
          email: 'agent@test.com'
        }
      }
    ])
  }),

  // Users endpoints
  http.get('/api/users', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'Access token required' },
        { status: 401 }
      )
    }

    return HttpResponse.json([
      {
        id: 'user-1',
        email: 'admin@test.com',
        name: 'Admin Test',
        role: 'ADMIN',
        organizationId: 'test-org-id',
        organization: {
          name: 'Test Organization',
          slug: 'test-org'
        },
        _count: {
          assignedTasks: 0
        }
      },
      {
        id: 'user-2',
        email: 'agent@test.com',
        name: 'Agent Test',
        role: 'AGENT',
        organizationId: 'test-org-id',
        organization: {
          name: 'Test Organization',
          slug: 'test-org'
        },
        _count: {
          assignedTasks: 5
        }
      }
    ])
  }),

  // Dashboard stats
  http.get('/api/dashboard/stats', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'Access token required' },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      totalTasks: 25,
      completedTasks: 15,
      inProgressTasks: 5,
      pendingTasks: 5,
      totalAgents: 8,
      agentStats: [
        {
          id: 'agent-1',
          name: 'Agent Test',
          totalTasks: 10,
          completedTasks: 8,
          inProgressTasks: 1,
          completionRate: 80,
          totalHours: 35.5
        }
      ]
    })
  }),

  // Error handling for unhandled requests
  http.all('*', ({ request }) => {
    console.warn(
      `Found an unhandled ${request.method} request to ${request.url}`
    )
    
    return HttpResponse.json(
      { message: 'Not found' },
      { status: 404 }
    )
  })
]