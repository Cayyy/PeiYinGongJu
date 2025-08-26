import { app, BrowserWindow, Menu, ipcMain, dialog } from "electron";
import { join } from "path";
import Store from "electron-store";

// 初始化设置存储
const store = new Store();

// 热重载配置
const isDev = process.env.NODE_ENV === "development";

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "preload.js"), // Fixed path
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true, // Added security setting
      allowRunningInsecureContent: false, // Added security setting
    },
  });

  // 开发环境使用本地服务器，生产环境使用本地文件
  if (isDev) {
    mainWindow.loadURL("http://localhost:5177"); // Updated port
    // 开发环境打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, "../index.html"));
  }

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  // 热重载：监听文件变化
  if (isDev) {
    mainWindow.webContents.on("did-finish-load", () => {
      console.log("页面加载完成，热重载已启用");
    });
  }
}

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
  // 设置应用ID
  if (process.platform === "darwin") {
    app.setAppUserModelId("com.配音工具.app"); // Replaced electronApp.setAppUserModelId
  }

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 所有窗口关闭时退出应用
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC 通信处理
ipcMain.handle("dialog:openDirectory", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  return result.filePaths;
});

ipcMain.handle("dialog:saveFile", async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result.filePath;
});

// 文件系统操作
ipcMain.handle("file:read", async (event, filePath: string) => {
  try {
    const fs = require("fs");
    const content = await fs.promises.readFile(filePath, "utf8");
    return content;
  } catch (error: any) {
    console.error("读取文件失败:", error);
    throw error;
  }
});

ipcMain.handle(
  "file:write",
  async (event, filePath: string, content: string) => {
    try {
      const fs = require("fs");
      const path = require("path");

      // 确保目录存在
      const dir = path.dirname(filePath);
      await fs.promises.mkdir(dir, { recursive: true });

      await fs.promises.writeFile(filePath, content, "utf8");
    } catch (error: any) {
      console.error("写入文件失败:", error);
      throw error;
    }
  }
);

// 项目操作
ipcMain.handle(
  "project:create",
  async (event, projectName: string, projectDescription: string = "") => {
    try {
      const settings = store.get("settings") as any;
      if (!settings || !settings.paths || !settings.paths.defaultProjectPath) {
        return { success: false, error: "未设置默认项目保存路径" };
      }

      const defaultPath = settings.paths.defaultProjectPath;
      const fs = require("fs");
      const path = require("path");

      // 生成唯一的项目ID（使用时间戳）
      const projectId = Date.now().toString();
      const projectPath = path.join(defaultPath, projectId);

      if (fs.existsSync(projectPath)) {
        return { success: false, error: "项目名称已存在" };
      }

      fs.mkdirSync(projectPath, { recursive: true });

      const projectConfig = {
        name: projectName,
        description: projectDescription,
        createTime: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };

      const configPath = path.join(projectPath, "project.json");
      fs.writeFileSync(configPath, JSON.stringify(projectConfig, null, 2));

      console.log("创建项目成功:", projectPath);
      return { success: true, projectId, projectPath };
    } catch (error: any) {
      console.error("创建项目失败:", error);
      return { success: false, error: error.message };
    }
  }
);

ipcMain.handle("project:open", async (event, projectPath: string) => {
  try {
    // 这里应该实现项目打开逻辑
    console.log("打开项目:", projectPath);
    return { success: true, projectPath };
  } catch (error: any) {
    console.error("打开项目失败:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("project:save", async (event, projectData: any) => {
  try {
    // 这里应该实现项目保存逻辑
    console.log("保存项目:", projectData);
    return { success: true };
  } catch (error: any) {
    console.error("保存项目失败:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("project:delete", async (event, projectId: number | string) => {
  try {
    const settings = store.get("settings") as any;
    if (!settings || !settings.paths || !settings.paths.defaultProjectPath) {
      return { success: false, error: "未设置默认项目保存路径" };
    }

    const defaultPath = settings.paths.defaultProjectPath;
    const fs = require("fs");
    const path = require("path");

    const projectPath = path.join(defaultPath, projectId.toString());

    if (!fs.existsSync(projectPath)) {
      return { success: false, error: "项目文件夹不存在" };
    }

    // 删除整个项目文件夹
    fs.rmSync(projectPath, { recursive: true, force: true });

    console.log("删除项目成功:", projectId);
    return { success: true };
  } catch (error: any) {
    console.error("删除项目失败:", error);
    return { success: false, error: error.message };
  }
});

// 更新项目
ipcMain.handle(
  "project:update",
  async (event, projectId: string, projectData: any) => {
    try {
      const settings = store.get("settings") as any;
      if (!settings || !settings.paths || !settings.paths.defaultProjectPath) {
        return { success: false, error: "未设置默认项目保存路径" };
      }

      const defaultPath = settings.paths.defaultProjectPath;
      const fs = require("fs");
      const path = require("path");

      const projectPath = path.join(defaultPath, projectId);
      const configPath = path.join(projectPath, "project.json");

      if (!fs.existsSync(configPath)) {
        return { success: false, error: "项目配置文件不存在" };
      }

      // 读取现有配置
      const existingContent = fs.readFileSync(configPath, "utf8");
      const existingConfig = JSON.parse(existingContent);

      // 更新配置
      const updatedConfig = {
        ...existingConfig,
        name: projectData.name,
        description: projectData.description,
        lastModified: new Date().toISOString(),
      };

      // 保存更新后的配置
      fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));

      console.log("更新项目成功:", projectId);
      return { success: true, projectConfig: updatedConfig };
    } catch (error: any) {
      console.error("更新项目失败:", error);
      return { success: false, error: error.message };
    }
  }
);

// 获取所有项目
ipcMain.handle("project:getAll", async (event) => {
  try {
    const settings = store.get("settings") as any;
    if (!settings || !settings.paths || !settings.paths.defaultProjectPath) {
      return { success: false, error: "未设置默认项目保存路径" };
    }

    const defaultPath = settings.paths.defaultProjectPath;
    const fs = require("fs");
    const path = require("path");

    if (!fs.existsSync(defaultPath)) {
      return { success: true, projects: [] };
    }

    const projectFolders = fs
      .readdirSync(defaultPath, { withFileTypes: true })
      .filter((dirent: any) => dirent.isDirectory())
      .map((dirent: any) => {
        const projectPath = path.join(defaultPath, dirent.name);
        const configPath = path.join(projectPath, "project.json");

        if (fs.existsSync(configPath)) {
          try {
            const content = fs.readFileSync(configPath, "utf8");
            const projectConfig = JSON.parse(content);
            return {
              id: dirent.name, // 使用文件夹名作为项目ID
              name: projectConfig.name || dirent.name,
              description: projectConfig.description || "",
              createTime: projectConfig.createTime
                ? new Date(projectConfig.createTime).toISOString().split("T")[0]
                : "",
              lastModified: projectConfig.lastModified
                ? new Date(projectConfig.lastModified)
                    .toISOString()
                    .split("T")[0]
                : "",
            };
          } catch (error) {
            console.error(`读取项目配置失败 ${configPath}:`, error);
            return null;
          }
        }
        return null;
      })
      .filter((project: any) => project !== null);

    return { success: true, projects: projectFolders };
  } catch (error: any) {
    console.error("获取项目列表失败:", error);
    return { success: false, error: error.message };
  }
});

// 剧集操作
ipcMain.handle(
  "episode:create",
  async (event, projectId: string, episodeData: any) => {
    try {
      // 获取设置中的默认项目路径
      const settings = store.get("settings") as any;
      if (!settings || !settings.paths || !settings.paths.defaultProjectPath) {
        return { success: false, error: "未设置默认项目保存路径" };
      }

      const defaultPath = settings.paths.defaultProjectPath;
      const fs = require("fs");
      const path = require("path");

      // 项目文件夹路径
      const projectPath = path.join(defaultPath, projectId);

      // 检查项目文件夹是否存在
      if (!fs.existsSync(projectPath)) {
        return { success: false, error: "项目文件夹不存在" };
      }

      // 创建剧集配置文件
      const episodeId = Date.now();
      const episodeConfig = {
        id: episodeId,
        title: episodeData.title,
        douyinUrl: episodeData.douyinUrl || "",
        description: episodeData.description || "",
        createTime: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };

      const episodesPath = path.join(projectPath, "episodes");
      if (!fs.existsSync(episodesPath)) {
        fs.mkdirSync(episodesPath, { recursive: true });
      }

      // 为每个剧集创建独立的文件夹
      const episodeFolderPath = path.join(episodesPath, episodeId.toString());
      if (!fs.existsSync(episodeFolderPath)) {
        fs.mkdirSync(episodeFolderPath, { recursive: true });
      }

      // 在剧集文件夹中创建配置文件和其他必要的子文件夹
      const configPath = path.join(episodeFolderPath, "episode.json");
      fs.writeFileSync(configPath, JSON.stringify(episodeConfig, null, 2));

      // 创建剧集相关的子文件夹
      const subFolders = ["scripts", "audio", "temp"];
      subFolders.forEach((folderName) => {
        const subFolderPath = path.join(episodeFolderPath, folderName);
        if (!fs.existsSync(subFolderPath)) {
          fs.mkdirSync(subFolderPath, { recursive: true });
        }
      });

      console.log("创建剧集成功:", configPath);
      return { success: true, episodeId, episodeConfig };
    } catch (error: any) {
      console.error("创建剧集失败:", error);
      return { success: false, error: error.message };
    }
  }
);

ipcMain.handle("episode:get", async (event, projectId: string) => {
  try {
    const settings = store.get("settings") as any;
    if (!settings || !settings.paths || !settings.paths.defaultProjectPath) {
      return { success: false, error: "未设置默认项目保存路径" };
    }

    const defaultPath = settings.paths.defaultProjectPath;
    const fs = require("fs");
    const path = require("path");

    const projectPath = path.join(defaultPath, projectId);
    const episodesPath = path.join(projectPath, "episodes");

    if (!fs.existsSync(episodesPath)) {
      return { success: true, episodes: [] };
    }

    const episodeFiles = fs
      .readdirSync(episodesPath)
      .filter((item: string) => {
        const itemPath = path.join(episodesPath, item);
        return fs.statSync(itemPath).isDirectory();
      })
      .map((folder: string) => {
        const configPath = path.join(episodesPath, folder, "episode.json");
        if (fs.existsSync(configPath)) {
          const content = fs.readFileSync(configPath, "utf8");
          return JSON.parse(content);
        }
        return null;
      })
      .filter((episode: any) => episode !== null)
      .sort(
        (a: any, b: any) =>
          new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
      );

    return { success: true, episodes: episodeFiles };
  } catch (error: any) {
    console.error("获取剧集列表失败:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle(
  "episode:update",
  async (
    event,
    projectId: string,
    episodeId: number | string,
    episodeData: any
  ) => {
    try {
      console.log("更新剧集参数:", { projectId, episodeId, episodeData });

      const settings = store.get("settings") as any;
      if (!settings || !settings.paths || !settings.paths.defaultProjectPath) {
        return { success: false, error: "未设置默认项目保存路径" };
      }

      const defaultPath = settings.paths.defaultProjectPath;
      const fs = require("fs");
      const path = require("path");

      const projectPath = path.join(defaultPath, projectId);
      const episodesPath = path.join(projectPath, "episodes");
      const episodeFolderPath = path.join(episodesPath, episodeId.toString());
      const configPath = path.join(episodeFolderPath, "episode.json");

      console.log("配置文件路径:", configPath);
      console.log("文件是否存在:", fs.existsSync(configPath));

      if (!fs.existsSync(configPath)) {
        // 列出所有剧集文件夹，帮助调试
        if (fs.existsSync(episodesPath)) {
          const folders = fs.readdirSync(episodesPath);
          console.log("现有剧集文件夹:", folders);
        }
        return { success: false, error: "剧集文件不存在" };
      }

      // 读取现有配置
      const existingContent = fs.readFileSync(configPath, "utf8");
      const existingConfig = JSON.parse(existingContent);

      // 更新剧集配置，保留原有的id和createTime
      const updatedConfig = {
        ...existingConfig,
        ...episodeData,
        id: existingConfig.id, // 保留原有ID
        createTime: existingConfig.createTime, // 保留原有创建时间
        lastModified: new Date().toISOString(),
      };

      fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));

      return { success: true, episodeConfig: updatedConfig };
    } catch (error: any) {
      console.error("更新剧集失败:", error);
      return { success: false, error: error.message };
    }
  }
);

ipcMain.handle(
  "episode:delete",
  async (event, projectId: string, episodeId: number | string) => {
    try {
      const settings = store.get("settings") as any;
      if (!settings || !settings.paths || !settings.paths.defaultProjectPath) {
        return { success: false, error: "未设置默认项目保存路径" };
      }

      const defaultPath = settings.paths.defaultProjectPath;
      const fs = require("fs");
      const path = require("path");

      const projectPath = path.join(defaultPath, projectId);
      const episodesPath = path.join(projectPath, "episodes");
      const episodeFolderPath = path.join(episodesPath, episodeId.toString());

      if (!fs.existsSync(episodeFolderPath)) {
        return { success: false, error: "剧集文件夹不存在" };
      }

      // 删除整个剧集文件夹
      fs.rmSync(episodeFolderPath, { recursive: true, force: true });

      return { success: true };
    } catch (error: any) {
      console.error("删除剧集失败:", error);
      return { success: false, error: error.message };
    }
  }
);

// 剧集角色相关的IPC处理器
ipcMain.handle(
  "episode:updateCharacters",
  async (
    event,
    projectId: string,
    episodeId: number | string,
    characters: string[]
  ) => {
    try {
      console.log("更新剧集角色:", { projectId, episodeId, characters });

      const settings = store.get("settings") as any;
      if (!settings || !settings.paths || !settings.paths.defaultProjectPath) {
        return { success: false, error: "未设置默认项目保存路径" };
      }

      const defaultPath = settings.paths.defaultProjectPath;
      const fs = require("fs");
      const path = require("path");

      const projectPath = path.join(defaultPath, projectId);
      const episodesPath = path.join(projectPath, "episodes");
      const episodeFolderPath = path.join(episodesPath, episodeId.toString());
      const configPath = path.join(episodeFolderPath, "episode.json");

      if (!fs.existsSync(configPath)) {
        return { success: false, error: "剧集配置文件不存在" };
      }

      // 读取现有配置
      const existingContent = fs.readFileSync(configPath, "utf8");
      const existingConfig = JSON.parse(existingContent);

      // 更新配置，添加角色信息
      const updatedConfig = {
        ...existingConfig,
        characters: characters,
        lastModified: new Date().toISOString(),
      };

      // 保存更新后的配置
      fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));

      console.log("剧集角色信息更新成功");
      return { success: true, episodeConfig: updatedConfig };
    } catch (error: any) {
      console.error("更新剧集角色失败:", error);
      return { success: false, error: error.message };
    }
  }
);

ipcMain.handle(
  "episode:getCharacters",
  async (event, projectId: string, episodeId: number | string) => {
    try {
      console.log("获取剧集角色:", { projectId, episodeId });

      const settings = store.get("settings") as any;
      if (!settings || !settings.paths || !settings.paths.defaultProjectPath) {
        return { success: false, error: "未设置默认项目保存路径" };
      }

      const defaultPath = settings.paths.defaultProjectPath;
      const fs = require("fs");
      const path = require("path");

      const projectPath = path.join(defaultPath, projectId);
      const episodesPath = path.join(projectPath, "episodes");
      const episodeFolderPath = path.join(episodesPath, episodeId.toString());
      const configPath = path.join(episodeFolderPath, "episode.json");

      if (!fs.existsSync(configPath)) {
        return { success: false, error: "剧集配置文件不存在" };
      }

      // 读取配置文件
      const content = fs.readFileSync(configPath, "utf8");
      const config = JSON.parse(content);

      // 返回角色信息
      const characters = config.characters || [];
      return { success: true, characters };
    } catch (error: any) {
      console.error("获取剧集角色失败:", error);
      return { success: false, error: error.message };
    }
  }
);

// 剧集文件操作相关的IPC处理器
ipcMain.handle(
  "episode:writeFile",
  async (
    event,
    projectId: string,
    episodeId: number | string,
    fileName: string,
    content: string
  ) => {
    try {
      console.log("写入剧集文件:", {
        projectId,
        episodeId,
        fileName,
        contentLength: content.length,
      });

      const settings = store.get("settings") as any;
      if (!settings || !settings.paths || !settings.paths.defaultProjectPath) {
        return { success: false, error: "未设置默认项目保存路径" };
      }

      const defaultPath = settings.paths.defaultProjectPath;
      const fs = require("fs");
      const path = require("path");

      const projectPath = path.join(defaultPath, projectId);
      const episodesPath = path.join(projectPath, "episodes");
      const episodeFolderPath = path.join(episodesPath, episodeId.toString());
      const filePath = path.join(episodeFolderPath, fileName);

      // 确保剧集目录存在
      if (!fs.existsSync(episodeFolderPath)) {
        fs.mkdirSync(episodeFolderPath, { recursive: true });
      }

      // 写入文件
      fs.writeFileSync(filePath, content, "utf8");

      console.log("剧集文件写入成功:", filePath);
      return { success: true, filePath };
    } catch (error: any) {
      console.error("写入剧集文件失败:", error);
      return { success: false, error: error.message };
    }
  }
);

ipcMain.handle(
  "episode:readFile",
  async (
    event,
    projectId: string,
    episodeId: number | string,
    fileName: string
  ) => {
    try {
      console.log("读取剧集文件:", { projectId, episodeId, fileName });

      const settings = store.get("settings") as any;
      if (!settings || !settings.paths || !settings.paths.defaultProjectPath) {
        return { success: false, error: "未设置默认项目保存路径" };
      }

      const defaultPath = settings.paths.defaultProjectPath;
      const fs = require("fs");
      const path = require("path");

      const projectPath = path.join(defaultPath, projectId);
      const episodesPath = path.join(projectPath, "episodes");
      const episodeFolderPath = path.join(episodesPath, episodeId.toString());
      const filePath = path.join(episodeFolderPath, fileName);

      if (!fs.existsSync(filePath)) {
        return { success: false, error: "文件不存在" };
      }

      // 读取文件
      const content = fs.readFileSync(filePath, "utf8");

      console.log("剧集文件读取成功:", filePath);
      return { success: true, content, filePath };
    } catch (error: any) {
      console.error("读取剧集文件失败:", error);
      return { success: false, error: error.message };
    }
  }
);

// 设置相关的IPC处理器
ipcMain.handle("settings:save", async (event, settings) => {
  try {
    // 保存设置到electron-store
    store.set("settings", settings);
    return { success: true };
  } catch (error: any) {
    console.error("保存设置失败:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("settings:get", async () => {
  try {
    // 从electron-store获取设置
    const settings = store.get("settings");
    return settings || null;
  } catch (error: any) {
    console.error("获取设置失败:", error);
    return null;
  }
});

// 获取配置文件路径
ipcMain.handle("config:getPath", async () => {
  try {
    const path = require("path");
    const os = require("os");

    // 根据操作系统返回配置文件路径
    let configPath;
    if (process.platform === "win32") {
      // Windows: %APPDATA%/配音工具
      configPath = path.join(process.env.APPDATA || os.homedir(), "配音工具");
    } else if (process.platform === "darwin") {
      // macOS: ~/Library/Application Support/配音工具
      configPath = path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "配音工具"
      );
    } else {
      // Linux: ~/.config/配音工具
      configPath = path.join(os.homedir(), ".config", "配音工具");
    }

    return configPath;
  } catch (error: any) {
    console.error("获取配置文件路径失败:", error);
    return null;
  }
});

// 打开文件夹
ipcMain.handle("shell:openPath", async (event, folderPath: string) => {
  try {
    const { shell } = require("electron");
    await shell.openPath(folderPath);
    return { success: true };
  } catch (error: any) {
    console.error("打开文件夹失败:", error);
    return { success: false, error: error.message };
  }
});

// DeepSeek API 调用
ipcMain.handle(
  "deepseek:call",
  async (event, prompt: string, settings: any) => {
    try {
      console.log("=== 主进程开始调用 DeepSeek API ===");
      console.log("请求参数:", { prompt, settings });

      if (!settings?.deepseek?.apiKey) {
        throw new Error("未配置 DeepSeek API Key");
      }

      // 提示词长度信息（不截断）
      console.log("提示词长度:", prompt.length);

      const apiKey = settings.deepseek.apiKey;
      const baseUrl = settings.deepseek.baseUrl || "https://api.deepseek.com";
      // DeepSeek 的正确模型名称
      const model = settings.deepseek.model || "deepseek-chat";
      const maxTokens = parseInt(settings.deepseek.maxTokens) || 6000;
      const temperature = parseFloat(settings.deepseek.temperature) || 1.0;

      // 验证模型名称
      const validModels = ["deepseek-chat", "deepseek-reasoner"];
      if (!validModels.includes(model)) {
        console.warn(
          `警告：模型名称 "${model}" 可能不正确，支持的模型：`,
          validModels
        );
      }

      console.log("API 配置:", { baseUrl, model, maxTokens, temperature });
      console.log("参数类型检查:", {
        maxTokens: typeof maxTokens,
        temperature: typeof temperature,
        model: typeof model,
        promptLength: prompt.length,
      });

      // 构建请求数据
      const requestData = {
        model: model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature: temperature,
        stream: false,
      };

      console.log("发送请求数据:", requestData);
      console.log("请求数据JSON长度:", JSON.stringify(requestData).length);

      // 发送请求到 DeepSeek API
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      };

      console.log("请求头:", headers);
      console.log("请求URL:", `${baseUrl}/v1/chat/completions`);

      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestData),
      });

      console.log("API 响应状态:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API 请求失败:", errorText);
        console.error("请求数据:", requestData);
        console.error("提示词长度:", prompt.length);
        console.error("提示词内容:", prompt.substring(0, 500) + "...");
        throw new Error(
          `API 请求失败: ${response.status} ${response.statusText}`
        );
      }

      const responseData = await response.json();
      console.log("DeepSeek API 完整响应:", responseData);

      // 提取生成的文本内容
      const generatedText = responseData.choices?.[0]?.message?.content;

      if (!generatedText) {
        console.error("API 响应中没有找到生成的文本");
        throw new Error("API 响应格式错误");
      }

      console.log("生成的文本内容:", generatedText);
      console.log("=== 主进程 DeepSeek API 调用完成 ===");

      return { success: true, data: generatedText };
    } catch (error: any) {
      console.error("主进程调用 DeepSeek API 失败:", error);
      return { success: false, error: error.message };
    }
  }
);

// 日志记录
ipcMain.handle(
  "log:write",
  async (event, level: string, message: string, data?: any) => {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level,
        message,
        data,
      };

      // 这里可以将日志写入文件或数据库
      console.log(`[${level.toUpperCase()}] ${message}`, data || "");

      // 保存到设置存储中（临时方案）
      const logs = (store.get("logs") as any[]) || [];
      logs.push(logEntry);

      // 只保留最近1000条日志
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }

      store.set("logs", logs);

      return { success: true };
    } catch (error: any) {
      console.error("写入日志失败:", error);
      return { success: false, error: error.message };
    }
  }
);

// 设置菜单
const template: Electron.MenuItemConstructorOptions[] = [
  {
    label: "文件",
    submenu: [
      {
        label: "新建项目",
        accelerator: "CmdOrCtrl+N",
        click: () => {
          // 发送新建项目事件到渲染进程
        },
      },
      {
        label: "打开项目",
        accelerator: "CmdOrCtrl+O",
        click: () => {
          // 发送打开项目事件到渲染进程
        },
      },
      { type: "separator" },
      {
        label: "退出",
        accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
        click: () => {
          app.quit();
        },
      },
    ],
  },
  {
    label: "编辑",
    submenu: [
      { role: "undo", label: "撤销" },
      { role: "redo", label: "重做" },
      { type: "separator" },
      { role: "cut", label: "剪切" },
      { role: "copy", label: "复制" },
      { role: "paste", label: "粘贴" },
    ],
  },
  {
    label: "视图",
    submenu: [
      { role: "reload", label: "重新加载" },
      { role: "forceReload", label: "强制重新加载" },
      { role: "toggleDevTools", label: "切换开发者工具" },
      { type: "separator" },
      { role: "resetZoom", label: "实际大小" },
      { role: "zoomIn", label: "放大" },
      { role: "zoomOut", label: "缩小" },
      { type: "separator" },
      { role: "togglefullscreen", label: "切换全屏" },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
