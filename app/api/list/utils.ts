import fs from 'fs';
import path from 'path';

export interface APIRoute {
  path: string;
  methods: string[];
  description?: string;
  file: string;
}

/**
 * 获取所有API路由信息
 */
export async function getAPIRoutes(): Promise<APIRoute[]> {
  const apiDir = path.join(process.cwd(), 'app', 'api');
  const routes: APIRoute[] = [];
  
  try {
    // 递归扫描api目录
    await scanAPIDirectory(apiDir, routes);
    
    // 过滤掉list页面自身
    return routes.filter(route => !route.path.includes('/list'));
  } catch (error) {
    console.error('获取API路由失败:', error);
    return [];
  }
}

/**
 * 递归扫描API目录
 */
async function scanAPIDirectory(dir: string, routes: APIRoute[]): Promise<void> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // 递归处理子目录
      await scanAPIDirectory(fullPath, routes);
    } else if (entry.isFile() && entry.name === 'route.ts') {
      // 找到route.ts文件，解析API路径
      const relativePath = path.relative(path.join(process.cwd(), 'app', 'api'), path.dirname(fullPath));
      const apiPath = relativePath ? `/${relativePath.split(path.sep).join('/')}` : '/';
      
      // 读取文件内容以分析HTTP方法
      const fileContent = await fs.promises.readFile(fullPath, 'utf-8');
      const methods = extractHTTPMethods(fileContent);
      const description = extractDescription(fileContent);
      
      routes.push({
        path: apiPath,
        methods,
        description,
        file: fullPath
      });
    }
  }
}

/**
 * 从route.ts文件中提取HTTP方法
 */
function extractHTTPMethods(fileContent: string): string[] {
  const methods: string[] = [];
  const methodPatterns: Record<string, RegExp> = {
    'GET': /export\s+async\s+function\s+GET\s*\(/,
    'POST': /export\s+async\s+function\s+POST\s*\(/,
    'PUT': /export\s+async\s+function\s+PUT\s*\(/,
    'DELETE': /export\s+async\s+function\s+DELETE\s*\(/,
    'PATCH': /export\s+async\s+function\s+PATCH\s*\(/,
    'OPTIONS': /export\s+async\s+function\s+OPTIONS\s*\(/,
    'HEAD': /export\s+async\s+function\s+HEAD\s*\(/
  };
  
  for (const [method, pattern] of Object.entries(methodPatterns)) {
    if (pattern.test(fileContent)) {
      methods.push(method);
    }
  }
  
  // 如果没有检测到特定的HTTP方法函数，假设支持所有方法
  return methods.length > 0 ? methods : ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
}

/**
 * 从文件头部注释中提取描述信息
 */
function extractDescription(fileContent: string): string | undefined {
  // 尝试从文件头部的JSDoc注释中提取描述
  const jsDocPattern = /\/\*\*[\s\S]*?\*\//;
  const match = fileContent.match(jsDocPattern);
  
  if (match) {
    const jsDoc = match[0];
    // 提取第一行描述
    // 匹配格式：/** 描述内容 或 /**\n * 描述内容
    const lines = jsDoc.split('\n');
    for (const line of lines) {
      // 匹配以 /** 开头且后面有内容的行，或匹配以 * 开头且后面有内容的行
      const lineMatch = line.match(/\/\*\*\s*(.+)$/) || line.match(/^\s*\*\s+(.+)$/);
      if (lineMatch && lineMatch[1]) {
        const desc = lineMatch[1].trim();
        // 跳过空行和结束标记
        if (desc && !desc.startsWith('*/')) {
          return desc;
        }
      }
    }
  }
  
  // 尝试从单行注释中提取描述
  const singleLinePattern = /^\s*\/\/\s*([^\n]*)/m;
  const singleMatch = fileContent.match(singleLinePattern);
  if (singleMatch && singleMatch[1]) {
    return singleMatch[1].trim();
  }
  
  return undefined;
}