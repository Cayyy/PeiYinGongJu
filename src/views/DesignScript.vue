<template>
  <div>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-text-box-edit</v-icon>
        设计文案
        <v-spacer></v-spacer>
        <v-btn color="success" prepend-icon="mdi-arrow-right" @click="nextStep">
          下一步：角色分配
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- 角色列表 -->
        <v-card class="mb-4" variant="outlined">
          <v-card-title>角色列表</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="newCharacter"
                  label="添加角色"
                  placeholder="输入角色名称"
                  variant="outlined"
                  density="compact"
                  @keyup.enter="addCharacter"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-btn
                  color="primary"
                  @click="addCharacter"
                  :disabled="!newCharacter.trim()"
                >
                  添加角色
                </v-btn>
              </v-col>
            </v-row>

            <v-chip-group>
              <v-chip
                v-for="character in characters"
                :key="character"
                closable
                @click:close="removeCharacter(character)"
                color="primary"
                variant="outlined"
              >
                {{ character }}
              </v-chip>
            </v-chip-group>
          </v-card-text>
        </v-card>

        <!-- 原文和文案编辑 -->
        <v-row>
          <v-col cols="12" md="6">
            <v-card variant="outlined">
              <v-card-title>原文参考</v-card-title>
              <v-card-text>
                <v-textarea
                  v-model="originalText"
                  label="输入小说原文"
                  rows="15"
                  variant="outlined"
                  @blur="saveOriginalText"
                  placeholder="在这里输入小说原文作为参考..."
                ></v-textarea>
                <div class="text-caption text-grey">
                  字数：{{ originalText.length }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <!-- 文案开头卡片 -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title>
                <v-expansion-panels
                  variant="accordion"
                  v-model="headerPanelOpen"
                >
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <div
                        class="d-flex align-center justify-space-between w-100"
                      >
                        <div class="d-flex align-center">
                          <v-icon class="mr-2">mdi-text-box-edit</v-icon>
                          文案开头
                          <v-chip
                            v-if="headerPanelOpen !== 0"
                            size="small"
                            color="primary"
                            variant="outlined"
                            class="ml-2"
                          >
                            {{ scriptHeader.length }} 字
                          </v-chip>
                        </div>
                        <div
                          v-if="headerPanelOpen === 0"
                          class="d-flex align-center"
                        >
                          <v-select
                            v-model="selectedPromptType"
                            :items="availablePromptTypes"
                            label="选择提示词类型"
                            variant="outlined"
                            density="compact"
                            class="mr-2"
                            style="min-width: 150px"
                            hide-details
                          ></v-select>
                          <v-btn
                            color="primary"
                            prepend-icon="mdi-robot"
                            @click="generateHeaderWithAI"
                            :loading="generatingHeader"
                            variant="outlined"
                            size="small"
                            :disabled="!selectedPromptType"
                          >
                            AI生成
                          </v-btn>
                        </div>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <div class="mb-3">
                        <v-textarea
                          v-model="scriptHeader"
                          label="文案开头"
                          variant="outlined"
                          @blur="saveScriptHeader"
                          placeholder="输入文案开头，如：欢迎收听..."
                          rows="3"
                          auto-grow
                          hide-details
                        ></v-textarea>
                        <!-- 调试信息 -->
                        <div class="text-caption text-grey mt-1">
                          当前内容长度: {{ scriptHeader.length }} 字符
                        </div>
                      </div>
                      <div class="d-flex justify-end">
                        <v-btn
                          size="small"
                          variant="text"
                          @click="clearScriptHeader"
                          :disabled="!scriptHeader"
                          color="error"
                        >
                          清空内容
                        </v-btn>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card-title>
            </v-card>

            <!-- 文案正文卡片 -->
            <v-card variant="outlined">
              <v-card-title>文案正文</v-card-title>
              <v-card-text>
                <v-textarea
                  v-model="scriptText"
                  label="正文"
                  rows="12"
                  variant="outlined"
                  @blur="saveScriptText"
                  placeholder="在这里输入配音文案..."
                ></v-textarea>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

// 响应式数据
const originalText = ref("");
const scriptText = ref("");
const scriptHeader = ref("");
const newCharacter = ref("");
const characters = ref<string[]>([]);
const aiPrompt = ref("");
const aiScripts = ref<Array<{ content: string; timestamp: string }>>([]);
const generating = ref(false);
const generatingHeader = ref(false);
const headerPanelOpen = ref(0); // 控制文案开头面板的展开状态

// 提示词选择相关
const selectedPromptType = ref("");
const availablePromptTypes = ref<Array<{ title: string; value: string }>>([]);

// 方法
const addCharacter = () => {
  if (
    newCharacter.value.trim() &&
    !characters.value.includes(newCharacter.value.trim())
  ) {
    characters.value.push(newCharacter.value.trim());
    newCharacter.value = "";
    saveCharacters();
  }
};

const removeCharacter = (character: string) => {
  const index = characters.value.indexOf(character);
  if (index > -1) {
    characters.value.splice(index, 1);
    saveCharacters();
  }
};

const saveOriginalText = async () => {
  try {
    const projectId = route.query.projectId;
    const episodeId = route.query.episodeId;

    if (projectId && episodeId) {
      // 保存到剧集目录下的原文文件
      const result = await window.electronAPI.writeEpisodeFile(
        projectId,
        episodeId,
        "原文.txt",
        originalText.value
      );

      if (result.success) {
        console.log("原文已保存到剧集目录");
      } else {
        console.error("保存原文失败:", result.error);
      }
    } else {
      console.error("缺少项目ID或剧集ID，无法保存原文");
    }
  } catch (error) {
    console.error("保存原文失败:", error);
  }
};

const saveScriptHeader = async () => {
  try {
    const projectId = route.query.projectId;
    const episodeId = route.query.episodeId;

    if (projectId && episodeId) {
      // 保存到剧集目录下的文案开头文件
      const result = await window.electronAPI.writeEpisodeFile(
        projectId,
        episodeId,
        "文案开头.txt",
        scriptHeader.value
      );

      if (result.success) {
        console.log("文案开头已保存到剧集目录");
      } else {
        console.error("保存文案开头失败:", result.error);
      }
    } else {
      console.error("缺少项目ID或剧集ID，无法保存文案开头");
    }
  } catch (error) {
    console.error("保存文案开头失败:", error);
  }
};

const clearScriptHeader = async () => {
  try {
    scriptHeader.value = "";
    await saveScriptHeader();
    console.log("文案开头已清空并保存");
  } catch (error) {
    console.error("清空文案开头失败:", error);
  }
};

const saveScriptText = async () => {
  try {
    const projectId = route.query.projectId;
    const episodeId = route.query.episodeId;

    if (projectId && episodeId) {
      // 保存到剧集目录下的文案文件
      const result = await window.electronAPI.writeEpisodeFile(
        projectId,
        episodeId,
        "文案.txt",
        scriptText.value
      );

      if (result.success) {
        console.log("文案已保存到剧集目录");
      } else {
        console.error("保存文案失败:", result.error);
      }
    } else {
      console.error("缺少项目ID或剧集ID，无法保存文案");
    }
  } catch (error) {
    console.error("保存文案失败:", error);
  }
};

const saveCharacters = async () => {
  try {
    // 保存到剧集配置文件
    const projectId = route.query.projectId;
    const episodeId = route.query.episodeId;

    console.log("保存角色 - 参数:", {
      projectId,
      episodeId,
      characters: characters.value,
    });

    if (projectId && episodeId) {
      // 创建普通数组，避免序列化问题
      const charactersArray = [...characters.value];

      // 更新剧集配置文件中的角色信息
      const result = await window.electronAPI.updateEpisodeCharacters(
        projectId,
        episodeId,
        charactersArray
      );

      console.log("保存角色 - 结果:", result);

      if (result.success) {
        console.log("角色信息已保存到剧集配置文件");
      } else {
        console.error("保存角色信息失败:", result.error);
      }
    } else {
      console.error("缺少项目ID或剧集ID:", { projectId, episodeId });
    }

    // 同时保存到本地文件作为备份
    const charactersText = [...characters.value].join("\n");
    await window.electronAPI.writeFile("角色.txt", charactersText);
  } catch (error) {
    console.error("保存角色失败:", error);
  }
};

const saveAIPrompt = async () => {
  try {
    await window.electronAPI.writeFile("AI文案/提示词.txt", aiPrompt.value);
  } catch (error) {
    console.error("保存AI提示词失败:", error);
  }
};

const generateHeaderWithAI = async () => {
  if (!originalText.value.trim()) {
    alert("请先输入原文内容");
    return;
  }

  if (!selectedPromptType.value) {
    alert("请先选择提示词类型");
    return;
  }

  console.log("=== 开始生成 AI 文案开头 ===");
  console.log("原文内容:", originalText.value.substring(0, 100) + "...");
  console.log("选择的提示词类型:", selectedPromptType.value);

  generatingHeader.value = true;
  try {
    // 获取设置中的提示词
    const settings = await window.electronAPI.getSettings();
    console.log("获取到的设置:", settings);
    let headerPrompt = "";

    if (settings?.aiPrompts?.headerPrompts?.length > 0) {
      console.log("可用的提示词:", settings.aiPrompts.headerPrompts);

      // 根据选择的提示词类型查找对应的提示词
      const selectedPrompt = settings.aiPrompts.headerPrompts.find(
        (p) => p.type === selectedPromptType.value
      );

      if (selectedPrompt) {
        console.log("找到匹配的提示词:", selectedPrompt);
        headerPrompt = selectedPrompt.prompt
          .replace("{originalText}", originalText.value || "")
          .replace("{episodeTitle}", "第1集") // 这里可以根据实际情况获取剧集标题
          .replace("{projectName}", "小说配音"); // 这里可以根据实际情况获取项目名称

        console.log("处理后的提示词:", headerPrompt);
      } else {
        console.log("未找到匹配的提示词，使用默认提示词");
        // 如果找不到对应的提示词，使用默认提示词
        headerPrompt = `请为小说配音生成一个吸引人的开头，要求：
1. 简洁有力，能吸引听众注意
2. 适合配音朗读
3. 长度控制在2-3句话
4. 可以包含欢迎词、剧集介绍等元素
${originalText.value ? `\n参考原文：${originalText.value}` : ""}`;
      }
    } else {
      console.log("未找到可用的提示词，使用默认提示词");
      // 使用默认提示词
      headerPrompt = `请为小说配音生成一个吸引人的开头，要求：
1. 简洁有力，能吸引听众注意
2. 适合配音朗读
3. 长度控制在2-3句话
4. 可以包含欢迎词、剧集介绍等元素
${originalText.value ? `\n参考原文：${originalText.value}` : ""}`;
    }

    console.log("最终使用的提示词:", headerPrompt);
    console.log("提示词长度:", headerPrompt.length);

    // 提示词长度信息（不截断）
    console.log("提示词长度:", headerPrompt.length);

    // 调用AI生成开头
    console.log("开始调用 DeepSeek API...");
    const generatedHeader = await callDeepSeekAPI(headerPrompt, "");

    console.log("API 返回的生成结果:", generatedHeader);

    scriptHeader.value = generatedHeader;

    // 自动保存生成的开头
    await saveScriptHeader();

    console.log("AI文案开头生成成功，已保存到表单");
    console.log("=== AI 文案开头生成完成 ===");
  } catch (error) {
    console.error("生成AI文案开头失败:", error);
    alert("生成文案开头失败：" + error);
  } finally {
    generatingHeader.value = false;
  }
};

const generateAIScript = async () => {
  if (!aiPrompt.value.trim()) return;

  generating.value = true;
  try {
    // 这里调用DeepSeek API生成文案
    const generatedScript = await callDeepSeekAPI(
      aiPrompt.value,
      originalText.value
    );

    const timestamp = new Date().toLocaleString();
    aiScripts.value.push({
      content: generatedScript,
      timestamp,
    });

    // 保存到本地
    await window.electronAPI.writeFile(
      `AI文案/${timestamp.replace(/[\/\s:]/g, "_")}.txt`,
      generatedScript
    );
  } catch (error) {
    console.error("生成AI文案失败:", error);
  } finally {
    generating.value = false;
  }
};

const useAIScript = (content: string) => {
  scriptText.value = content;
  saveScriptText();
};

const nextStep = () => {
  router.push("/characters");
};

const callDeepSeekAPI = async (prompt: string, originalText: string) => {
  try {
    console.log("=== 开始调用 DeepSeek API ===");
    console.log("请求参数:", { prompt, originalText });

    // 获取设置中的 DeepSeek 配置
    const settings = await window.electronAPI.getSettings();
    console.log("DeepSeek 设置:", settings?.deepseek);

    if (!settings?.deepseek?.apiKey) {
      throw new Error("未配置 DeepSeek API Key");
    }

    console.log("通过 IPC 调用主进程的 DeepSeek API...");

    // 通过 IPC 调用主进程的 DeepSeek API
    const result = await window.electronAPI.callDeepSeekAPI(prompt, settings);

    if (!result.success) {
      throw new Error(result.error || "API 调用失败");
    }

    console.log("主进程返回的生成结果:", result.data);
    console.log("=== DeepSeek API 调用完成 ===");

    return result.data;
  } catch (error) {
    console.error("调用 DeepSeek API 失败:", error);
    throw error;
  }
};

onMounted(() => {
  loadProjectData();
});

const loadProjectData = async () => {
  try {
    // 加载项目数据
    const projectId = route.query.projectId;
    const episodeId = route.query.episodeId;

    if (projectId && episodeId) {
      console.log("加载项目:", projectId, "剧集:", episodeId);

      // 加载剧集配置文件中的角色信息
      const result = await window.electronAPI.getEpisodeCharacters(
        projectId,
        episodeId
      );

      if (result.success && result.characters) {
        characters.value = result.characters;
        console.log("已加载角色信息:", characters.value);
      } else {
        console.log("未找到已保存的角色信息，使用默认空列表");
        characters.value = [];
      }

      // 加载其他已保存的数据
      await loadSavedData();

      // 加载可用的提示词类型
      await loadAvailablePromptTypes();
    }
  } catch (error) {
    console.error("加载项目数据失败:", error);
  }
};

const loadAvailablePromptTypes = async () => {
  try {
    // 获取设置中的提示词类型
    const settings = await window.electronAPI.getSettings();

    if (settings?.aiPrompts?.headerPrompts?.length > 0) {
      // 将提示词转换为下拉框选项格式
      availablePromptTypes.value = settings.aiPrompts.headerPrompts.map(
        (prompt) => ({
          title: prompt.type,
          value: prompt.type,
        })
      );

      // 默认选择第一个提示词类型
      if (availablePromptTypes.value.length > 0) {
        selectedPromptType.value = availablePromptTypes.value[0].value;
      }

      console.log("已加载提示词类型:", availablePromptTypes.value);
    } else {
      availablePromptTypes.value = [];
      selectedPromptType.value = "";
      console.log("未找到可用的提示词类型");
    }
  } catch (error) {
    console.error("加载提示词类型失败:", error);
    availablePromptTypes.value = [];
    selectedPromptType.value = "";
  }
};

const loadSavedData = async () => {
  try {
    const projectId = route.query.projectId;
    const episodeId = route.query.episodeId;

    if (projectId && episodeId) {
      // 加载已保存的原文
      try {
        const originalResult = await window.electronAPI.readEpisodeFile(
          projectId,
          episodeId,
          "原文.txt"
        );
        if (originalResult.success) {
          originalText.value = originalResult.content;
        }
      } catch (error) {
        // 未找到已保存的原文
      }

      // 加载已保存的文案开头
      try {
        const headerResult = await window.electronAPI.readEpisodeFile(
          projectId,
          episodeId,
          "文案开头.txt"
        );
        if (headerResult.success) {
          scriptHeader.value = headerResult.content;
          // 如果有内容，自动展开面板
          if (scriptHeader.value.trim()) {
            headerPanelOpen.value = 0;
          }
        }
      } catch (error) {
        // 未找到已保存的文案开头
      }

      // 加载已保存的文案
      try {
        const scriptResult = await window.electronAPI.readEpisodeFile(
          projectId,
          episodeId,
          "文案.txt"
        );
        if (scriptResult.success) {
          scriptText.value = scriptResult.content;
        }
      } catch (error) {
        // 未找到已保存的文案
      }
    }
  } catch (error) {
    console.error("加载已保存数据失败:", error);
  }
};
</script>
