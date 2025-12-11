// 导出客户端
export { getLibsqlClient } from "./client";

// 导出 schema 相关
export { ensureUsersTable } from "./schema";

// 导出用户相关操作
export {
  saveUserToLibsql,
  getUserByEmail,
  updateUser,
  deleteUser,
} from "./users";

// 文章相关
export {
  ensureArticles,
  createArticle,
  updateArticle,
  listArticles,
  findBySlug,
  findById,
  slugExists,
  softDeleteArticle,
  restoreArticle,
} from "./articles";

