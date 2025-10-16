export const environment = {
  production: false,
  // Use same-origin relative paths so the browser requests go to the frontend server
  // and Nginx can proxy them to in-cluster services.
  userApiBase: '/api/users',
  taskApiBase: '/api/tasks'
};
