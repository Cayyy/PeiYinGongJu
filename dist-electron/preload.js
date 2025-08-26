"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // 文件对话框
  openDirectory: () => electron.ipcRenderer.invoke("dialog:openDirectory"),
  saveFile: (options) => electron.ipcRenderer.invoke("dialog:saveFile", options),
  // 文件系统操作
  readFile: (filePath) => electron.ipcRenderer.invoke("file:read", filePath),
  writeFile: (filePath, content) => electron.ipcRenderer.invoke("file:write", filePath, content),
  // 项目操作
  createProject: (projectName, projectDescription) => electron.ipcRenderer.invoke("project:create", projectName, projectDescription),
  getProjects: () => electron.ipcRenderer.invoke("project:getAll"),
  updateProject: (projectId, projectData) => electron.ipcRenderer.invoke("project:update", projectId, projectData),
  openProject: (projectPath) => electron.ipcRenderer.invoke("project:open", projectPath),
  saveProject: (projectData) => electron.ipcRenderer.invoke("project:save", projectData),
  deleteProject: (projectId) => electron.ipcRenderer.invoke("project:delete", projectId),
  // 剧集操作
  createEpisode: (projectId, episodeData) => electron.ipcRenderer.invoke("episode:create", projectId, episodeData),
  getEpisodes: (projectId) => electron.ipcRenderer.invoke("episode:get", projectId),
  updateEpisode: (projectId, episodeId, episodeData) => electron.ipcRenderer.invoke("episode:update", projectId, episodeId, episodeData),
  deleteEpisode: (projectId, episodeId) => electron.ipcRenderer.invoke("episode:delete", projectId, episodeId),
  // 剧集角色操作
  updateEpisodeCharacters: (projectId, episodeId, characters) => electron.ipcRenderer.invoke(
    "episode:updateCharacters",
    projectId,
    episodeId,
    characters
  ),
  getEpisodeCharacters: (projectId, episodeId) => electron.ipcRenderer.invoke("episode:getCharacters", projectId, episodeId),
  // 剧集文件操作
  writeEpisodeFile: (projectId, episodeId, fileName, content) => electron.ipcRenderer.invoke(
    "episode:writeFile",
    projectId,
    episodeId,
    fileName,
    content
  ),
  readEpisodeFile: (projectId, episodeId, fileName) => electron.ipcRenderer.invoke("episode:readFile", projectId, episodeId, fileName),
  // 设置相关
  saveSettings: (settings) => electron.ipcRenderer.invoke("settings:save", settings),
  getSettings: () => electron.ipcRenderer.invoke("settings:get"),
  // DeepSeek API 调用
  callDeepSeekAPI: (prompt, settings) => electron.ipcRenderer.invoke("deepseek:call", prompt, settings),
  // 配置相关
  getConfigPath: () => electron.ipcRenderer.invoke("config:getPath"),
  openPath: (folderPath) => electron.ipcRenderer.invoke("shell:openPath", folderPath),
  // 日志记录
  log: (level, message, data) => electron.ipcRenderer.invoke("log:write", level, message, data)
});
