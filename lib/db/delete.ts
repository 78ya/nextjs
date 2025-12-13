// 导入数据库客户端
import { getLibsqlClient } from "./client";

/**
 * 清空表数据函数
 * 用于测试或数据重置场景
 */
export async function tableInDelete(): Promise<void> {
    console.log('开始清空数据库表数据...');
    
    try {
        // 获取数据库客户端连接
        console.log('获取数据库客户端连接...');
        const client = await getLibsqlClient();
        
        // 临时禁用外键约束检查，以避免外键约束错误
        console.log('临时禁用外键约束检查...');
        await client.execute('PRAGMA foreign_keys = OFF');
        
        try {
            // 修改删除顺序，确保先删除所有引用users表的表，再删除users表
            // 按照从最依赖到被依赖的顺序排列
            const tablesToDelete = [
                { name: 'user_logs', description: '用户日志表' },
                { name: 'email_verifications', description: '邮箱验证码表' },
                { name: 'sessions', description: '会话表' },
                { name: 'app_config', description: '应用配置表' },
                { name: 'users', description: '用户表' }
            ];
            
            // 逐个删除表数据
            for (const table of tablesToDelete) {
                console.log(`清空表 ${table.name} (${table.description})...`);
                try {
                    // 使用DELETE FROM语句
                    const result = await client.execute(`DELETE FROM "${table.name}"`);
                    console.log(`表 ${table.name} 清空完成，影响行数: ${result.rowsAffected}`);
                } catch (error) {
                    console.error(`清空表 ${table.name} 时出错:`, error);
                    // 继续尝试清空其他表
                }
            }
            
            console.log('所有数据库表数据清空操作完成');
        } finally {
            // 确保无论如何都重新启用外键约束
            console.log('重新启用外键约束检查...');
            try {
                await client.execute('PRAGMA foreign_keys = ON');
            } catch (pragmaError) {
                console.error('启用外键约束失败:', pragmaError);
            }
        }
    } catch (error) {
        console.error('清空表数据时发生错误:', error);
        throw error; // 重新抛出错误，让调用者知道操作失败
    }
}