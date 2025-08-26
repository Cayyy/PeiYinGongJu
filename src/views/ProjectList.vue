<template>
  <div>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-folder-multiple</v-icon>
        项目列表
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="showCreateDialog = true"
        >
          新建项目
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="12">
            <v-text-field
              v-model="searchQuery"
              label="搜索项目"
              prepend-inner-icon="mdi-magnify"
              clearable
              variant="outlined"
              density="compact"
            ></v-text-field>
          </v-col>
        </v-row>

        <v-data-table
          :headers="headers"
          :items="filteredProjects"
          :search="searchQuery"
          class="elevation-1"
        >
          <template v-slot:item.name="{ item }">
            <v-btn variant="text" color="primary" @click="openProject(item)">
              {{ item.name }}
            </v-btn>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="editProject(item)"
            ></v-btn>
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="deleteProject(item)"
            ></v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- 新建项目对话框 -->
    <v-dialog v-model="showCreateDialog" max-width="500px">
      <v-card>
        <v-card-title>新建项目</v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-text-field
              v-model="newProject.name"
              label="项目名称"
              :rules="[(v: any) => !!v || '项目名称不能为空']"
              required
              variant="outlined"
              clearable
            ></v-text-field>
            <v-text-field
              v-model="newProject.description"
              label="项目描述"
              rows="3"
              variant="outlined"
              clearable
            ></v-text-field>
            <v-alert type="info" variant="tonal" class="mt-3">
              <div class="text-body-2">
                <strong>项目保存位置：</strong>{{ projectSaveLocation }}
              </div>
              <div class="text-caption mt-1">
                如需修改默认保存路径，请前往"设置 → 路径设置"中配置
              </div>
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="createProject"
            :disabled="!valid || !defaultProjectPath"
          >
            创建
          </v-btn>
          <v-btn @click="showCreateDialog = false">取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 编辑项目对话框 -->
    <v-dialog v-model="showEditDialog" max-width="500px">
      <v-card>
        <v-card-title>编辑项目</v-card-title>
        <v-card-text>
          <v-form ref="editForm" v-model="editValid">
            <v-text-field
              v-model="editingProject.name"
              label="项目名称"
              :rules="[(v: any) => !!v || '项目名称不能为空']"
              required
              variant="outlined"
              clearable
            ></v-text-field>
            <v-text-field
              v-model="editingProject.description"
              label="项目描述"
              rows="3"
              variant="outlined"
              clearable
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="saveProject" :disabled="!editValid">
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
import { useRouter } from "vue-router";

const router = useRouter();

// 响应式数据
const searchQuery = ref("");
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const valid = ref(false);
const editValid = ref(false);
const form = ref();
const editForm = ref();
const defaultProjectPath = ref("");

// 定义项目类型
interface Project {
  id: string;
  name: string;
  description: string;
  createTime: string;
  lastModified: string;
}

const newProject = ref({
  name: "",
  description: "",
});

const editingProject = ref<Project>({
  id: "",
  name: "",
  description: "",
  createTime: "",
  lastModified: "",
});

const projects = ref<Project[]>([]);

const headers = [
  { title: "项目名称", key: "name", sortable: true },
  { title: "描述", key: "description", sortable: false },
  { title: "创建时间", key: "createTime", sortable: true },
  { title: "最后修改", key: "lastModified", sortable: true },
  { title: "操作", key: "actions", sortable: false },
];

// 计算属性
const filteredProjects = computed(() => {
  return projects.value;
});

// 计算项目保存位置
const projectSaveLocation = computed(() => {
  if (!defaultProjectPath.value) {
    return "未设置默认路径";
  }
  if (!newProject.value.name) {
    return `${defaultProjectPath.value}\\项目名`;
  }
  return `${defaultProjectPath.value}\\${newProject.value.name}`;
});

// 方法
const createProject = async () => {
  if (!form.value.validate()) return;

  try {
    const result = await window.electronAPI.createProject(
      newProject.value.name,
      newProject.value.description
    );

    if (result.success) {
      // 添加到项目列表
      projects.value.push({
        id: result.projectId || Date.now().toString(),
        name: newProject.value.name,
        description: newProject.value.description,
        createTime: new Date().toISOString().split("T")[0],
        lastModified: new Date().toISOString().split("T")[0],
      });

      showCreateDialog.value = false;
      resetForm();
    } else {
      alert("创建项目失败：" + (result.error || "未知错误"));
    }
  } catch (error) {
    console.error("创建项目失败:", error);
    alert("创建项目失败：" + error);
  }
};

const openProject = (project: Project) => {
  router.push({
    name: "EpisodeList",
    params: {
      projectId: project.id,
    },
    query: {
      projectName: project.name,
    },
  });
};

const editProject = (project: Project) => {
  editingProject.value = { ...project };
  showEditDialog.value = true;
};

const saveProject = async () => {
  if (!editForm.value.validate()) return;

  try {
    // 只传递必要的项目数据，避免序列化问题
    const projectData = {
      name: editingProject.value.name,
      description: editingProject.value.description,
    };

    const result = await window.electronAPI.updateProject(
      editingProject.value.id,
      projectData
    );

    if (result.success) {
      // 更新项目列表
      const index = projects.value.findIndex(
        (p) => p.id === editingProject.value.id
      );
      if (index > -1) {
        projects.value[index] = { ...editingProject.value };
        projects.value[index].lastModified = new Date()
          .toISOString()
          .split("T")[0];
      }

      showEditDialog.value = false;
    } else {
      alert("保存项目失败：" + (result.error || "未知错误"));
    }
  } catch (error) {
    console.error("保存项目失败:", error);
    alert("保存项目失败：" + error);
  }
};

const deleteProject = async (project: Project) => {
  // 确认删除
  if (!confirm(`确定要删除项目"${project.name}"吗？此操作不可撤销。`)) {
    return;
  }

  try {
    const result = await window.electronAPI.deleteProject(project.id);

    if (result.success) {
      // 从列表中移除项目
      const index = projects.value.findIndex((p) => p.id === project.id);
      if (index > -1) {
        projects.value.splice(index, 1);
      }
      alert("项目删除成功");
    } else {
      alert("删除项目失败：" + (result.error || "未知错误"));
    }
  } catch (error) {
    console.error("删除项目失败:", error);
    alert("删除项目失败：" + error);
  }
};

const resetForm = () => {
  newProject.value = {
    name: "",
    description: "",
  };
  form.value?.resetValidation();
};

onMounted(() => {
  // 加载项目列表
  loadProjects();
  loadDefaultProjectPath(); // 加载默认项目路径
});

const loadProjects = async () => {
  try {
    const result = await window.electronAPI.getProjects();
    if (result.success && result.projects) {
      projects.value = result.projects;
    }
  } catch (error) {
    console.error("加载项目列表失败:", error);
  }
};

// 加载默认项目路径
const loadDefaultProjectPath = async () => {
  try {
    const savedSettings = await window.electronAPI.getSettings();
    if (
      savedSettings &&
      savedSettings.paths &&
      savedSettings.paths.defaultProjectPath
    ) {
      defaultProjectPath.value = savedSettings.paths.defaultProjectPath;
    }
  } catch (error) {
    console.error("加载默认项目路径失败:", error);
  }
};
</script>
