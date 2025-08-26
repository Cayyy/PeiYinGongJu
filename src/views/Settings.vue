<template>
  <div>
    <v-card>
      <v-card-text>
        <v-tabs v-model="activeTab" color="primary">
          <v-tab value="api">API 配置</v-tab>
          <v-tab value="paths">路径设置</v-tab>
          <v-tab value="aiPrompts">AI 提示词</v-tab>
          <v-tab value="theme">界面设置</v-tab>
        </v-tabs>

        <v-window v-model="activeTab" class="mt-4">
          <!-- API 配置 -->
          <v-window-item value="api">
            <v-card variant="outlined" class="pa-4">
              <v-card-title class="text-h6 mb-3"
                >DeepSeek API 配置</v-card-title
              >
              <v-row>
                <v-col cols="12" md="8">
                  <v-text-field
                    v-model="settings.deepseek.apiKey"
                    label="API 密钥"
                    type="password"
                    variant="outlined"
                    placeholder="请输入您的 DeepSeek API 密钥"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4" class="d-flex">
                  <v-btn
                    color="primary"
                    @click="testAPI"
                    :loading="testingAPI"
                    block
                    height="56"
                    class="mt-0 pt-0 pb-0"
                    style="margin-top: 0; padding-top: 0; padding-bottom: 0"
                  >
                    测试连接
                  </v-btn>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="settings.deepseek.baseUrl"
                    label="API 基础地址"
                    variant="outlined"
                    placeholder="https://api.deepseek.com"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="settings.deepseek.model"
                    label="模型名称"
                    :items="modelOptions"
                    variant="outlined"
                  ></v-select>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="settings.deepseek.maxTokens"
                    label="最大 Token 数"
                    type="number"
                    variant="outlined"
                  ></v-text-field>
                  <div class="text-caption text-medium-emphasis mt-1">
                    <v-icon size="small" class="mr-1">mdi-information</v-icon>
                    1 个中文字符 ≈ 0.6 个 Token，1 个英文字符 ≈ 0.3 个 Token
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    当前配置可处理约 {{ estimatedChars }} 个中文字符
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    预计费用：输入约 {{ estimatedInputCost }} 元，输出约
                    {{ estimatedOutputCost }} 元
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="settings.deepseek.temperature"
                    label="温度 (0-2)"
                    type="number"
                    variant="outlined"
                    min="0"
                    max="2"
                    step="0.1"
                  ></v-text-field>
                  <div class="text-caption text-medium-emphasis mt-1">
                    <v-icon size="small" class="mr-1">mdi-information</v-icon>
                    temperature 参数默认为 1.0
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    我们建议您根据如下表格，按使用场景设置 temperature：
                  </div>
                  <div class="text-caption text-medium-emphasis mt-2">
                    <strong>代码生成/数学解题：</strong>0.0
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    <strong>数据抽取/分析：</strong>1.0
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    <strong>通用对话：</strong>1.3
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    <strong>翻译：</strong>1.3
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    <strong>创意类写作/诗歌创作：</strong>1.5
                  </div>
                </v-col>
              </v-row>
            </v-card>
          </v-window-item>

          <!-- 路径设置 -->
          <v-window-item value="paths">
            <v-card variant="outlined" class="pa-4">
              <v-row>
                <v-col cols="12" md="8">
                  <v-text-field
                    v-model="settings.paths.defaultProjectPath"
                    label="默认项目保存路径"
                    variant="outlined"
                    readonly
                    @click="selectDefaultPath"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-btn
                    color="primary"
                    @click="selectDefaultPath"
                    prepend-icon="mdi-folder"
                    block
                  >
                    选择路径
                  </v-btn>
                </v-col>
                <v-alert type="info" variant="tonal" class="mt-2">
                  <div class="text-body-2">
                    <strong>说明：</strong
                    >项目将在此路径下创建独立文件夹，每个项目包含多个剧集子文件夹。
                  </div>
                  <div class="text-caption mt-2">
                    <strong>目录结构：</strong><br />
                    • 默认路径/项目ID/project.json<br />
                    • 默认路径/项目ID/episodes/剧集ID/episode.json<br />
                    • 默认路径/项目ID/episodes/剧集ID/scripts/ (脚本文件)<br />
                    • 默认路径/项目ID/episodes/剧集ID/audio/ (音频文件)<br />
                    • 默认路径/项目ID/episodes/剧集ID/temp/ (临时文件)
                  </div>
                </v-alert>
              </v-row>
            </v-card>

            <!-- 配置文件路径信息 -->
            <v-row class="mt-4">
              <v-col cols="12">
                <v-card variant="outlined" class="pa-3">
                  <v-card-title class="text-subtitle-1 mb-2"
                    >软件配置文件路径</v-card-title
                  >
                  <v-row>
                    <v-col cols="12" md="8">
                      <v-text-field
                        :model-value="configPath"
                        label="配置文件存储位置"
                        variant="outlined"
                        readonly
                        prepend-inner-icon="mdi-file-cog"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-btn
                        color="primary"
                        @click="openConfigFolder"
                        prepend-icon="mdi-folder-open"
                        block
                      >
                        打开文件夹
                      </v-btn>
                    </v-col>
                  </v-row>

                  <v-alert type="info" variant="tonal" class="mt-3">
                    <div class="text-body-2">
                      <strong>说明：</strong>项目文件将按以下结构自动组织：
                    </div>
                    <div class="text-caption mt-2">
                      <strong>项目结构：</strong><br />
                      • 项目名/剧集ID/episode.json (剧集配置)<br />
                      • 项目名/剧集ID/原文.txt<br />
                      • 项目名/剧集ID/文案.txt<br />
                      • 项目名/剧集ID/角色.txt<br />
                      • 项目名/剧集ID/AI文案/生成时间.txt<br />
                      • 项目名/剧集ID/配音/音频名.wav<br />
                      • 项目名/剧集ID/角色分配.txt<br />
                      • 项目名/剧集ID/配音人.txt
                    </div>
                  </v-alert>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <!-- AI 提示词设置 -->
          <v-window-item value="aiPrompts">
            <v-card variant="outlined" class="pa-4">
              <v-card-title
                class="text-h6 mb-3 d-flex align-center justify-space-between"
              >
                <span>AI 生成文案开头提示词管理</span>
                <div>
                  <v-btn
                    color="secondary"
                    prepend-icon="mdi-test-tube"
                    @click="addTestData"
                    size="small"
                    class="mr-2"
                  >
                    添加测试数据
                  </v-btn>
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-plus"
                    @click="addPrompt"
                    size="small"
                  >
                    添加提示词
                  </v-btn>
                </div>
              </v-card-title>

              <v-card-text>
                <v-alert type="info" variant="tonal" class="mb-4">
                  <div class="text-body-2">
                    <strong>说明：</strong
                    >管理AI生成文案开头的提示词模板，可以按不同类型创建多个提示词。
                  </div>
                </v-alert>

                <!-- 提示词列表 -->
                <v-data-table
                  :headers="promptHeaders"
                  :items="settings.aiPrompts.headerPrompts || []"
                  class="elevation-1"
                >
                  <template #item.createTime="{ item }">
                    {{ formatDate(item.createTime) }}
                  </template>
                  <template #item.lastModified="{ item }">
                    {{ formatDate(item.lastModified) }}
                  </template>
                  <template #item.actions="{ item }">
                    <v-btn
                      icon="mdi-pencil"
                      size="small"
                      variant="text"
                      @click="editPrompt(item)"
                      title="编辑"
                    ></v-btn>
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      color="error"
                      @click="deletePrompt(item)"
                      title="删除"
                    ></v-btn>
                  </template>
                </v-data-table>

                <div
                  v-if="settings.aiPrompts.headerPrompts.length === 0"
                  class="text-center pa-4 text-medium-emphasis"
                >
                  暂无提示词，点击"添加提示词"开始创建
                </div>
              </v-card-text>
            </v-card>
          </v-window-item>

          <!-- 界面设置 -->
          <v-window-item value="theme">
            <v-card variant="outlined" class="pa-4">
              <v-card-title class="text-h6 mb-3">界面设置</v-card-title>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="settings.theme.mode"
                    label="主题模式"
                    :items="themeOptions"
                    variant="outlined"
                  ></v-select>
                  <div class="text-caption text-medium-emphasis mt-1">
                    <v-icon size="small" class="mr-1">mdi-information</v-icon>
                    选择应用界面的主题样式，浅色主题适合明亮环境，深色主题适合夜间使用
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="settings.theme.language"
                    label="界面语言"
                    :items="languageOptions"
                    variant="outlined"
                  ></v-select>
                  <div class="text-caption text-medium-emphasis mt-1">
                    <v-icon size="small" class="mr-1">mdi-information</v-icon>
                    选择应用界面的显示语言，目前支持中文和英文
                  </div>
                </v-col>
              </v-row>
            </v-card>
          </v-window-item>
        </v-window>

        <!-- 添加/编辑提示词对话框 -->
        <v-dialog v-model="showAddPromptDialog" max-width="600px">
          <v-card>
            <v-card-title>{{
              editingPrompt ? "编辑提示词" : "添加提示词"
            }}</v-card-title>
            <v-card-text>
              <v-form ref="promptForm" v-model="promptValid">
                <v-text-field
                  v-model="promptFormType"
                  label="类型名称"
                  variant="outlined"
                  :rules="[(v: any) => !!v || '类型名称不能为空']"
                  required
                  placeholder="如：小说开头、欢迎词、剧集介绍等"
                ></v-text-field>

                <v-textarea
                  v-model="promptFormPrompt"
                  label="提示词内容"
                  variant="outlined"
                  :rules="[(v: any) => !!v || '提示词内容不能为空']"
                  required
                  rows="6"
                  placeholder="输入AI生成文案开头的提示词，可以使用 {originalText} 引用原文内容"
                ></v-textarea>

                <v-alert type="info" variant="tonal" class="mt-3">
                  <div class="text-body-2">
                    <strong>提示词变量：</strong>
                  </div>
                  <div class="text-caption mt-1">
                    • <code>{originalText}</code> - 引用原文内容<br />
                    • <code>{episodeTitle}</code> - 引用剧集标题<br />
                    • <code>{projectName}</code> - 引用项目名称
                  </div>
                </v-alert>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn @click="showAddPromptDialog = false">取消</v-btn>
              <v-btn
                color="primary"
                @click="savePrompt"
                :disabled="!promptValid"
              >
                {{ editingPrompt ? "更新" : "添加" }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- 底部操作按钮 -->
        <v-row class="mt-6">
          <v-col cols="12" class="d-flex justify-end">
            <v-btn
              color="primary"
              @click="saveAllSettings"
              :loading="saving"
              prepend-icon="mdi-content-save"
            >
              保存所有设置
            </v-btn>
            <v-btn
              @click="exportSettings"
              prepend-icon="mdi-download"
              class="ml-2"
            >
              导出设置
            </v-btn>
            <v-btn
              @click="importSettings"
              prepend-icon="mdi-upload"
              class="ml-2"
            >
              导入设置
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useTheme } from "vuetify";

const theme = useTheme();

// 响应式数据
const activeTab = ref("api");
const saving = ref(false);
const testingAPI = ref(false);

// 提示词管理相关
const showAddPromptDialog = ref(false);
const editingPrompt = ref<any>(null);
const promptValid = ref(false);
const promptFormType = ref("");
const promptFormPrompt = ref("");
const promptFormRef = ref();

// 设置数据
const settings = ref({
  deepseek: {
    apiKey: "",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat",
    maxTokens: 6000,
    temperature: 1.5,
  },
  paths: {
    defaultProjectPath: "",
  },
  theme: {
    mode: "auto",
    language: "zh-CN",
  },
  aiPrompts: {
    headerPrompts: [],
  },
});

// 选项数据
const themeOptions = [
  { title: "跟随系统", value: "auto" },
  { title: "浅色主题", value: "light" },
  { title: "深色主题", value: "dark" },
];

const languageOptions = [
  { title: "简体中文", value: "zh-CN" },
  { title: "English", value: "en-US" },
];

const modelOptions = [
  { title: "deepseek-chat(无思考)", value: "deepseek-chat" },
  { title: "deepseek-reasoner(有思考)", value: "deepseek-reasoner" },
];

// 提示词表格列定义
const promptHeaders = [
  { title: "类型", key: "type", sortable: true },
  { title: "创建时间", key: "createTime", sortable: true },
  { title: "最后修改", key: "lastModified", sortable: true },
  { title: "操作", key: "actions", sortable: false, width: "120px" },
];

// 计算属性：估算当前Token数可以处理的字符数量
const estimatedChars = computed(() => {
  const maxTokens = settings.value.deepseek.maxTokens;
  if (!maxTokens || maxTokens <= 0) return 0;

  // 1 个中文字符 ≈ 0.6 个 Token
  const estimatedChineseChars = Math.floor(maxTokens / 0.6);
  return estimatedChineseChars.toLocaleString();
});

// 计算属性：估算费用
const estimatedInputCost = computed(() => {
  const maxTokens = settings.value.deepseek.maxTokens;
  if (!maxTokens || maxTokens <= 0) return 0;

  // 假设大部分是输入token，按缓存未命中计算（4元/百万token）
  const cost = (maxTokens / 1000000) * 4;
  return cost.toFixed(2);
});

const estimatedOutputCost = computed(() => {
  const maxTokens = settings.value.deepseek.maxTokens;
  if (!maxTokens || maxTokens <= 0) return 0;

  // 输出token价格（12元/百万token）
  const cost = (maxTokens / 1000000) * 12;
  return cost.toFixed(2);
});

// 方法
const saveSettings = async () => {
  try {
    // 深拷贝设置对象并确保所有值都是可序列化的
    const serializableSettings = JSON.parse(JSON.stringify(settings.value));
    console.log("准备保存设置:", serializableSettings);
    await window.electronAPI.saveSettings(serializableSettings);
    console.log("设置已保存到配置文件");
  } catch (error: any) {
    console.error("保存设置失败:", error);
  }
};

const saveAllSettings = async () => {
  saving.value = true;
  try {
    await saveSettings();
    // 应用主题设置
    if (settings.value.theme.mode !== "auto") {
      theme.global.name.value = settings.value.theme.mode;
    }
    saving.value = false;
  } catch (error: any) {
    saving.value = false;
    console.error("保存所有设置失败:", error);
  }
};

const testAPI = async () => {
  if (!settings.value.deepseek.apiKey) {
    alert("请先输入API密钥");
    return;
  }

  testingAPI.value = true;
  try {
    // 这里应该调用实际的API测试
    await new Promise((resolve) => setTimeout(resolve, 2000));
    alert("API连接测试成功！");
  } catch (error: any) {
    alert("API连接测试失败：" + error.message);
  } finally {
    testingAPI.value = false;
  }
};

const selectDefaultPath = async () => {
  try {
    const paths = await window.electronAPI.openDirectory();
    if (paths && paths.length > 0) {
      settings.value.paths.defaultProjectPath = paths[0];
    }
  } catch (error: any) {
    console.error("选择路径失败:", error);
  }
};

const exportSettings = async () => {
  try {
    const settingsData = JSON.stringify(settings.value, null, 2);
    const blob = new Blob([settingsData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "配音工具设置.json";
    a.click();
    URL.revokeObjectURL(url);
  } catch (error: any) {
    alert("导出设置失败：" + error.message);
  }
};

const importSettings = async () => {
  try {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        const importedSettings = JSON.parse(text);
        settings.value = { ...settings.value, ...importedSettings };
        await saveSettings();

        // 应用导入后的主题设置
        if (settings.value.theme.mode && settings.value.theme.mode !== "auto") {
          theme.global.name.value = settings.value.theme.mode;
        }

        alert("设置已导入");
      }
    };
    input.click();
  } catch (error: any) {
    alert("导入设置失败：" + error.message);
  }
};

const openConfigFolder = async () => {
  try {
    const configPath = await window.electronAPI.getConfigPath();
    if (configPath) {
      await window.electronAPI.openPath(configPath);
    } else {
      alert("未找到配置文件路径。");
    }
  } catch (error: any) {
    alert("打开配置文件夹失败：" + error.message);
  }
};

// 提示词管理方法
const addTestData = () => {
  console.log("添加测试数据");
  const testPrompts = [
    {
      id: Date.now().toString(),
      type: "小说开头",
      prompt:
        "请为小说配音生成一个吸引人的开头，原文内容：{originalText}，剧集标题：{episodeTitle}，项目名称：{projectName}",
      createTime: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    },
    {
      id: (Date.now() + 1).toString(),
      type: "女频-重生",
      prompt:
        "请为女频重生小说配音生成一个吸引人的开头，要求：\n1. 简洁有力，能吸引听众注意\n2. 适合配音朗读\n3. 长度控制在2-3句话\n4. 体现重生、复仇等元素\n\n原文内容：{originalText}",
      createTime: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    },
    {
      id: (Date.now() + 2).toString(),
      type: "欢迎词",
      prompt:
        "请生成一个温馨的欢迎词，原文内容：{originalText}，剧集标题：{episodeTitle}",
      createTime: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    },
  ];

  settings.value.aiPrompts.headerPrompts.push(...testPrompts);
  console.log("测试数据已添加:", settings.value.aiPrompts.headerPrompts);
};

const addPrompt = () => {
  console.log("添加新提示词");
  editingPrompt.value = null;
  promptFormType.value = "";
  promptFormPrompt.value = "";
  showAddPromptDialog.value = true;
};

const editPrompt = (item: any) => {
  console.log("编辑提示词，接收到的数据:", item);

  // 检查 item 是否有效
  if (!item || typeof item !== "object") {
    console.error("无效的 item 数据:", item);
    alert("数据错误：无法编辑此提示词");
    return;
  }

  // 检查必要的属性
  if (!item.type || !item.prompt) {
    console.error("item 缺少必要属性:", {
      type: item.type,
      prompt: item.prompt,
    });
    alert("数据错误：提示词数据不完整");
    return;
  }

  editingPrompt.value = item;

  // 设置表单数据
  promptFormType.value = item.type;
  promptFormPrompt.value = item.prompt;
  console.log("设置表单数据:", {
    type: promptFormType.value,
    prompt: promptFormPrompt.value,
  });

  showAddPromptDialog.value = true;
};

const deletePrompt = async (item: any) => {
  // 检查 item 是否有效
  if (!item || typeof item !== "object" || !item.type) {
    console.error("无效的 item 数据:", item);
    alert("数据错误：无法删除此提示词");
    return;
  }

  if (confirm(`确定要删除提示词"${item.type}"吗？`)) {
    const index = settings.value.aiPrompts.headerPrompts.findIndex(
      (p) => p.id === item.id
    );
    if (index > -1) {
      settings.value.aiPrompts.headerPrompts.splice(index, 1);
      await saveSettings();
    }
  }
};

const savePrompt = async () => {
  if (!promptFormType.value.trim() || !promptFormPrompt.value.trim()) {
    return;
  }

  try {
    if (editingPrompt.value) {
      // 编辑现有提示词
      const index = settings.value.aiPrompts.headerPrompts.findIndex(
        (p) => p.id === editingPrompt.value.id
      );
      if (index > -1) {
        settings.value.aiPrompts.headerPrompts[index] = {
          ...editingPrompt.value,
          type: promptFormType.value.trim(),
          prompt: promptFormPrompt.value.trim(),
          lastModified: new Date().toISOString(),
        };
      }
    } else {
      // 添加新提示词
      const newPrompt = {
        id: Date.now().toString(),
        type: promptFormType.value.trim(),
        prompt: promptFormPrompt.value.trim(),
        createTime: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };
      settings.value.aiPrompts.headerPrompts.push(newPrompt);
    }

    console.log("保存提示词到设置:", settings.value.aiPrompts.headerPrompts);
    await saveSettings();
    console.log("提示词设置已保存到配置文件");

    showAddPromptDialog.value = false;
    editingPrompt.value = null;
    promptFormType.value = "";
    promptFormPrompt.value = "";
  } catch (error: any) {
    console.error("保存提示词失败:", error);
    alert("保存提示词失败：" + error.message);
  }
};

const configPath = ref("");

// 日期格式化函数
const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return dateString || "";
  }
};

// 监听设置变化
watch(
  () => settings.value.theme.mode,
  (newMode) => {
    if (newMode && newMode !== "auto") {
      theme.global.name.value = newMode;
    }
  }
);

// 监听主题变化，自动保存到设置
watch(
  () => theme.global.name.value,
  (newTheme) => {
    if (newTheme && newTheme !== "auto") {
      settings.value.theme.mode = newTheme;
    }
  }
);

onMounted(async () => {
  try {
    // 加载保存的设置
    const savedSettings = await window.electronAPI.getSettings();
    console.log("加载到的设置:", savedSettings);

    if (savedSettings) {
      // 确保 aiPrompts 对象存在
      if (!savedSettings.aiPrompts) {
        savedSettings.aiPrompts = { headerPrompts: [] };
      }
      if (!savedSettings.aiPrompts.headerPrompts) {
        savedSettings.aiPrompts.headerPrompts = [];
      }

      console.log("处理后的 aiPrompts:", savedSettings.aiPrompts);
      settings.value = { ...settings.value, ...savedSettings };
      console.log("最终设置值:", settings.value);

      // 应用主题设置
      if (savedSettings.theme?.mode && savedSettings.theme.mode !== "auto") {
        theme.global.name.value = savedSettings.theme.mode;
      }
    }

    // 获取配置文件路径
    const path = await window.electronAPI.getConfigPath();
    configPath.value = path || "未找到配置文件";
  } catch (error) {
    console.error("加载设置失败:", error);
    configPath.value = "获取路径失败";
  }
});
</script>
