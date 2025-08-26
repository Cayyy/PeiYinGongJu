<template>
  <div>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-btn
          icon="mdi-arrow-left"
          variant="text"
          @click="goBack"
          class="mr-3"
        ></v-btn>
        <v-icon class="mr-2">mdi-playlist-play</v-icon>
        {{ projectName }} - 剧集列表
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
        >
          新建剧集
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="12">
            <v-text-field
              v-model="searchQuery"
              label="搜索剧集"
              prepend-inner-icon="mdi-magnify"
              clearable
              variant="outlined"
              density="compact"
            ></v-text-field>
          </v-col>
        </v-row>

        <v-data-table
          :headers="headers"
          :items="filteredEpisodes"
          :search="searchQuery"
          class="elevation-1"
        >
          <template v-slot:item.title="{ item }">
            <v-btn variant="text" color="primary" @click="openEpisode(item)">
              {{ item.title }}
            </v-btn>
          </template>

          <template v-slot:item.description="{ item }">
            <div
              class="text-truncate"
              style="max-width: 200px"
              :title="item.description"
            >
              {{ item.description || "无描述" }}
            </div>
          </template>

          <template v-slot:item.douyinUrl="{ item }">
            <v-btn
              v-if="item.douyinUrl"
              variant="text"
              color="info"
              size="small"
              @click="openDouyinUrl(item.douyinUrl)"
              prepend-icon="mdi-play-circle"
            >
              查看视频
            </v-btn>
            <span v-else class="text-medium-emphasis">未设置</span>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="editEpisode(item)"
              title="编辑剧集"
            ></v-btn>
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="deleteEpisode(item)"
              title="删除剧集"
            ></v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- 新建剧集对话框 -->
    <v-dialog v-model="showCreateDialog" max-width="600px">
      <v-card>
        <v-card-title>新建剧集</v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-text-field
              v-model="newEpisode.title"
              label="剧集标题"
              :rules="[(v: any) => !!v || '剧集标题不能为空']"
              required
              variant="outlined"
              clearable
            ></v-text-field>
            <v-textarea
              v-model="newEpisode.description"
              label="剧集描述"
              rows="3"
              variant="outlined"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="createEpisode" :disabled="!valid">
            创建
          </v-btn>
          <v-btn @click="showCreateDialog = false">取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 编辑剧集对话框 -->
    <v-dialog v-model="showEditDialog" max-width="600px">
      <v-card>
        <v-card-title>编辑剧集</v-card-title>
        <v-card-text>
          <v-form ref="editForm" v-model="editValid">
            <v-text-field
              v-model="editingEpisode.title"
              label="剧集标题"
              :rules="[(v: any) => !!v || '剧集标题不能为空']"
              required
            ></v-text-field>
            <v-text-field
              v-model="editingEpisode.douyinUrl"
              label="抖音视频地址"
              placeholder="https://www.douyin.com/video/..."
              variant="outlined"
            ></v-text-field>
            <v-textarea
              v-model="editingEpisode.description"
              label="剧集描述"
              rows="3"
              variant="outlined"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="saveEpisode" :disabled="!editValid">
            保存
          </v-btn>
          <v-btn @click="showEditDialog = false">取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

// 获取项目ID和名称
const projectId = route.params.projectId as string;
const projectName = ref("加载中...");

// 获取项目信息
const loadProjectInfo = async () => {
  try {
    const result = await window.electronAPI.getProjects();
    if (result.success && result.projects) {
      const project = result.projects.find((p: any) => p.id === projectId);
      if (project) {
        projectName.value = project.name;
      } else {
        projectName.value = "未知项目";
      }
    }
  } catch (error) {
    console.error("加载项目信息失败:", error);
    projectName.value = "未知项目";
  }
};

// 响应式数据
const searchQuery = ref("");
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const valid = ref(false);
const editValid = ref(false);
const form = ref();
const editForm = ref();

const newEpisode = ref({
  title: "",
  description: "",
});

// 定义剧集类型
interface Episode {
  id: number;
  title: string;
  douyinUrl: string;
  description: string;
  createTime: string;
  lastModified: string;
}

// 创建默认剧集对象
const createDefaultEpisode = (): Episode => ({
  id: 0,
  title: "",
  douyinUrl: "",
  description: "",
  createTime: new Date().toISOString(),
  lastModified: new Date().toISOString(),
});

const editingEpisode = ref<Episode>(createDefaultEpisode());

const episodes = ref<Episode[]>([]);

const headers = [
  { title: "标题", key: "title", sortable: true },
  { title: "描述", key: "description", sortable: false },
  { title: "创建时间", key: "createTime", sortable: true },
  { title: "最后修改", key: "lastModified", sortable: true },
  { title: "抖音视频地址", key: "douyinUrl", sortable: false },
  { title: "操作", key: "actions", sortable: false },
];

// 计算属性
const filteredEpisodes = computed(() => {
  return episodes.value;
});

// 计算下一个剧集序号
const nextEpisodeNumber = computed(() => {
  if (!episodes.value || episodes.value.length === 0) {
    return 1;
  }

  // 从现有剧集标题中提取序号
  const episodeNumbers = episodes.value
    .map((episode) => {
      // 安全检查：确保episode和title存在
      if (!episode || !episode.title || typeof episode.title !== "string") {
        return 0;
      }
      const match = episode.title.match(/第?(\d+)集/);
      return match ? parseInt(match[1]) : 0;
    })
    .filter((num) => num > 0);

  if (episodeNumbers.length === 0) {
    return episodes.value.length + 1;
  }

  // 返回最大序号 + 1
  return Math.max(...episodeNumbers) + 1;
});

// 计算下一个剧集标题
const nextEpisodeTitle = computed(() => {
  return `第${nextEpisodeNumber.value}集`;
});

// 方法
const openCreateDialog = () => {
  // 设置默认标题
  newEpisode.value.title = nextEpisodeTitle.value;
  newEpisode.value.description = "";
  // 打开对话框
  showCreateDialog.value = true;
};

const createEpisode = async () => {
  if (!form.value.validate()) return;

  try {
    // 创建普通对象，避免序列化问题
    const episodeData = {
      title: newEpisode.value.title,
      description: newEpisode.value.description,
    };

    const result = await window.electronAPI.createEpisode(
      projectId,
      episodeData
    );

    if (result.success) {
      // 保存创建的剧集标题，用于提示信息
      const createdTitle = newEpisode.value.title;

      // 重新加载剧集列表，确保数据同步
      await loadEpisodes();

      showCreateDialog.value = false;
      resetForm();

      // 显示成功提示
      alert(`剧集"${createdTitle}"创建成功！`);
    } else {
      alert("创建剧集失败：" + (result.error || "未知错误"));
    }
  } catch (error) {
    console.error("创建剧集失败:", error);
    alert("创建剧集失败：" + error);
  }
};

const openEpisode = (episode: Episode) => {
  // 进入剧集详情页面
  router.push(`/design?projectId=${projectId}&episodeId=${episode.id}`);
};

const editEpisode = (episode: Episode) => {
  console.log("编辑剧集 - 原始数据:", episode);
  editingEpisode.value = { ...episode };
  console.log("编辑剧集 - 复制后的数据:", editingEpisode.value);
  showEditDialog.value = true;
};

const saveEpisode = async () => {
  if (!editForm.value.validate()) return;

  try {
    // 创建普通对象，避免序列化问题
    const episodeData = {
      title: editingEpisode.value.title,
      description: editingEpisode.value.description,
      douyinUrl: editingEpisode.value.douyinUrl,
    };

    console.log("保存剧集参数:", {
      projectId,
      episodeId: editingEpisode.value.id,
      episodeData,
    });

    const result = await window.electronAPI.updateEpisode(
      projectId,
      editingEpisode.value.id,
      episodeData
    );

    if (result.success) {
      // 重新加载剧集列表，确保数据同步
      await loadEpisodes();

      showEditDialog.value = false;
    } else {
      alert("保存剧集失败：" + (result.error || "未知错误"));
    }
  } catch (error) {
    console.error("保存剧集失败:", error);
    alert("保存剧集失败：" + error);
  }
};

const deleteEpisode = async (episode: Episode) => {
  if (!confirm(`确定要删除剧集"${episode.title}"吗？此操作不可撤销。`)) {
    return;
  }

  try {
    const result = await window.electronAPI.deleteEpisode(
      projectId,
      episode.id
    );

    if (result.success) {
      // 重新加载剧集列表，确保数据同步
      await loadEpisodes();
      alert("剧集删除成功");
    } else {
      alert("删除剧集失败：" + (result.error || "未知错误"));
    }
  } catch (error) {
    console.error("删除剧集失败:", error);
    alert("删除剧集失败：" + error);
  }
};

const openDouyinUrl = (url: string) => {
  if (url) {
    window.open(url, "_blank");
  }
};

const resetForm = () => {
  newEpisode.value = {
    title: nextEpisodeTitle.value,
    description: "",
  };
  form.value?.resetValidation();
};

const goBack = () => {
  router.push("/");
};

onMounted(() => {
  // 加载项目信息和剧集列表
  loadProjectInfo();
  loadEpisodes();
});

const loadEpisodes = async () => {
  try {
    const result = await window.electronAPI.getEpisodes(projectId);
    console.log("加载剧集结果:", result);
    if (result.success && result.episodes) {
      console.log("原始剧集数据:", result.episodes);
      // 数据验证和清理
      const validEpisodes = result.episodes.map((episode: any) => {
        console.log("处理单个剧集:", episode);
        const processedEpisode = {
          id: episode.id != null ? episode.id : 0, // 使用 != null 而不是 ||，避免将有效的0值替换
          title: episode.title || "未知标题",
          description: episode.description || "",
          douyinUrl: episode.douyinUrl || "",
          createTime: episode.createTime || new Date().toISOString(),
          lastModified: episode.lastModified || new Date().toISOString(),
        };
        console.log("处理后的单个剧集:", processedEpisode);
        return processedEpisode;
      });
      console.log("处理后的剧集数据:", validEpisodes);
      episodes.value = validEpisodes;
    } else {
      episodes.value = [];
    }
  } catch (error) {
    console.error("加载剧集列表失败:", error);
    episodes.value = [];
  }
};
</script>
