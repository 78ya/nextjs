import { getAPIRoutes } from './utils';
import APIClient from './APIClient';

export default async function APIListPage() {
  const routes = await getAPIRoutes();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">API 接口列表</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">查看和测试所有可用的 API 接口</p>
        </header>
        
        <div className="grid gap-6">
          {routes.length > 0 ? (
            routes.map((route, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 border border-zinc-200 dark:border-zinc-700"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-white">{route.path}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{route.description || '无描述信息'}</p>
                  </div>
                  <div className="flex gap-2">
                    {route.methods.map((method, i) => (
                      <span 
                        key={i} 
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getMethodColorClass(method)}`}
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* 使用独立的APIClient组件 */}
                <APIClient 
                  route={route.path} 
                  initialMethods={route.methods} 
                />
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 text-center border border-zinc-200 dark:border-zinc-700">
              <p className="text-zinc-500 dark:text-zinc-400">未找到可用的 API 接口</p>
              <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">请确保在 app/api 目录下存在 route.ts 文件</p>
            </div>
          )}
        </div>
        
        <footer className="mt-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <p>API 接口测试工具 | Next.js App Router</p>
        </footer>
      </div>
    </div>
  );
}

// 获取请求方法对应的样式类
function getMethodColorClass(method: string) {
  const methodMap: Record<string, string> = {
    'GET': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'POST': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'PUT': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'DELETE': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'PATCH': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'OPTIONS': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    'HEAD': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  };
  
  return methodMap[method] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
}

