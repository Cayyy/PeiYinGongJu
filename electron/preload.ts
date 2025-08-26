import { contextBridge, ipcRenderer } from "electron";

// 暴露安全的API到渲染进程
contextBridge.exposeInMainWorld("electronAPI", {
  // 文件对话框
  openDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
  saveFile: (options: any) => ipcRenderer.invoke("dialog:saveFile", options),

  // 文件系统操作
  readFile: (filePath: string) => ipcRenderer.invoke("file:read", filePath),
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke("file:write", filePath, content),

  // 项目操作
  createProject: (projectName: string, projectDescription?: string) =>
    ipcRenderer.invoke("project:create", projectName, projectDescription),
  getProjects: () => ipcRenderer.invoke("project:getAll"),
  updateProject: (projectId: string, projectData: any) =>
    ipcRenderer.invoke("project:update", projectId, projectData),
  openProject: (projectPath: string) =>
    ipcRenderer.invoke("project:open", projectPath),
  saveProject: (projectData: any) =>
    ipcRenderer.invoke("project:save", projectData),
  deleteProject: (projectId: number | string) =>
    ipcRenderer.invoke("project:delete", projectId),

  // 剧集操作
  createEpisode: (projectId: string, episodeData: any) =>
    ipcRenderer.invoke("episode:create", projectId, episodeData),
  getEpisodes: (projectId: string) =>
    ipcRenderer.invoke("episode:get", projectId),
  updateEpisode: (projectId: string, episodeId: number, episodeData: any) =>
    ipcRenderer.invoke("episode:update", projectId, episodeId, episodeData),
  deleteEpisode: (projectId: string, episodeId: number) =>
    ipcRenderer.invoke("episode:delete", projectId, episodeId),

  // 剧集角色操作
  updateEpisodeCharacters: (
    projectId: string,
    episodeId: number | string,
    characters: string[]
  ) =>
    ipcRenderer.invoke(
      "episode:updateCharacters",
      projectId,
      episodeId,
      characters
    ),
  getEpisodeCharacters: (projectId: string, episodeId: number | string) =>
    ipcRenderer.invoke("episode:getCharacters", projectId, episodeId),

  // 剧集文件操作
  writeEpisodeFile: (
    projectId: string,
    episodeId: number | string,
    fileName: string,
    content: string
  ) =>
    ipcRenderer.invoke(
      "episode:writeFile",
      projectId,
      episodeId,
      fileName,
      content
    ),
  readEpisodeFile: (
    projectId: string,
    episodeId: number | string,
    fileName: string
  ) => ipcRenderer.invoke("episode:readFile", projectId, episodeId, fileName),

  // 设置相关
  saveSettings: (settings: any) =>
    ipcRenderer.invoke("settings:save", settings),
  getSettings: () => ipcRenderer.invoke("settings:get"),

  // DeepSeek API 调用
  callDeepSeekAPI: (prompt: string, settings: any) =>
    ipcRenderer.invoke("deepseek:call", prompt, settings),

  // 配置相关
  getConfigPath: () => ipcRenderer.invoke("config:getPath"),
  openPath: (folderPath: string) =>
    ipcRenderer.invoke("shell:openPath", folderPath),

  // 日志记录
  log: (level: string, message: string, data?: any) =>
    ipcRenderer.invoke("log:write", level, message, data),
});

// 全局类型声明
declare global {
  interface Window {
    electronAPI: {
      openDirectory: () => Promise<string[]>;
      saveFile: (options: any) => Promise<string | undefined>;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<void>;
      createProject: (
        projectName: string,
        projectDescription?: string
      ) => Promise<any>;
      getProjects: () => Promise<any>;
      updateProject: (projectId: string, projectData: any) => Promise<any>;
      openProject: (projectPath: string) => Promise<any>;
      saveProject: (projectData: any) => Promise<any>;
      deleteProject: (projectId: number | string) => Promise<any>;
      createEpisode: (projectId: string, episodeData: any) => Promise<any>;
      getEpisodes: (projectId: string) => Promise<any>;
      updateEpisode: (
        projectId: string,
        episodeId: number,
        episodeData: any
      ) => Promise<any>;
      deleteEpisode: (projectId: string, episodeId: number) => Promise<any>;
      updateEpisodeCharacters: (
        projectId: string,
        episodeId: number | string,
        characters: string[]
      ) => Promise<any>;
      getEpisodeCharacters: (
        projectId: string,
        episodeId: number | string
      ) => Promise<any>;
      writeEpisodeFile: (
        projectId: string,
        episodeId: number | string,
        fileName: string,
        content: string
      ) => Promise<any>;
      readEpisodeFile: (
        projectId: string,
        episodeId: number | string,
        fileName: string
      ) => Promise<any>;
      saveSettings: (
        settings: any
      ) => Promise<{ success: boolean; error?: string }>;
      getSettings: () => Promise<any>;
      callDeepSeekAPI: (
        prompt: string,
        settings: any
      ) => Promise<{ success: boolean; data?: string; error?: string }>;
      getConfigPath: () => Promise<string>;
      openPath: (
        folderPath: string
      ) => Promise<{ success: boolean; error?: string }>;
      log: (level: string, message: string, data?: any) => Promise<void>;
    };
  }
}
