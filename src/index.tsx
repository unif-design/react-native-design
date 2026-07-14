// @unif/react-native-design 公共入口:theme(设计令牌)/ icons / utils / 组件(ui · business)。
// 文档站共享首页样式以 `./docs-home.css` 子路径导出(供各 Docusaurus 文档站 import,见 package.json#exports)。
// 该 CSS 只为副作用而 import(不取任何绑定),故 package.json#sideEffects 必须保留 `"*.css"`:
// 写成 `false` 会让 webpack 生产构建把它当无副作用模块摇掉 —— 首页 class 全在、样式全无,
// 且 dev 不开 sideEffects 优化(只在 build 后暴露)。
// 0.5.1:修 docs-home.css 深色 OS 兜底选择器恒真(系统深色 + 站点切浅色时内容区被强制深色),见 #52。
export * from './theme';
export * from './icons';
export * from './utils/testID';
export * from './utils/logger';
// 组件按 ui(基础)· business(业务)分层导出。文档站:https://unif-design.github.io/react-native-design/。
export * from './components/ui';
export * from './components/business';
