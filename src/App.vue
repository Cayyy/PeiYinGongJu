<template>
  <v-app>
    <!-- 左侧导航菜单 - 只在项目相关页面时显示，但不在设计文案页面显示 -->
    <v-navigation-drawer
      v-model="drawer"
      permanent
      v-if="showNavigation && !isDesignPage"
    >
      <v-list-item
        prepend-avatar="https://randomuser.me/api/portraits/men/85.jpg"
        :title="userName"
        nav
      >
      </v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.to"
          nav
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar>
      <!-- 返回按钮和设置标题 - 只在设置页面时显示 -->
      <v-btn
        icon
        @click="goBack"
        v-if="isSettingsPage"
        variant="text"
        color="primary"
        class="mr-2"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      <div v-if="isSettingsPage" class="d-flex align-center">
        <v-icon class="mr-2">mdi-cog</v-icon>
        <span class="text-h6">设置</span>
      </div>

      <!-- 返回按钮 - 在设计文案页面时显示 -->
      <v-btn
        icon
        @click="goBackToEpisodeList"
        v-if="isDesignPage"
        variant="text"
        color="primary"
        class="mr-2"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      <!-- 汉堡菜单按钮 - 只在项目相关页面时显示，但不在设计文案页面显示 -->
      <v-app-bar-nav-icon
        @click="drawer = !drawer"
        v-if="showNavigation && !isDesignPage"
      ></v-app-bar-nav-icon>

      <v-spacer></v-spacer>

      <v-btn icon @click="toggleTheme">
        <v-icon>{{ themeIcon }}</v-icon>
      </v-btn>

      <v-btn icon @click="openSettings">
        <v-icon>mdi-cog</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useTheme } from "vuetify";
import { useRouter, useRoute } from "vue-router";

const theme = useTheme();
const router = useRouter();
const route = useRoute();

const drawer = ref(true);
const userName = ref("配音师");

// 判断是否显示导航菜单 - 只在项目相关页面显示
const showNavigation = computed(() => {
  const projectPages = ["/design", "/characters", "/dubbing"];
  return projectPages.includes(route.path);
});

const menuItems = [
  { title: "项目列表", icon: "mdi-folder-multiple", to: "/" },
  { title: "设计文案", icon: "mdi-text-box-edit", to: "/design" },
  { title: "角色分配", icon: "mdi-account-multiple", to: "/characters" },
  { title: "配音生成", icon: "mdi-microphone", to: "/dubbing" },
  { title: "设置", icon: "mdi-cog", to: "/settings" },
];

const themeIcon = computed(() => {
  return theme.global.current.value.dark
    ? "mdi-weather-sunny"
    : "mdi-weather-night";
});

const toggleTheme = async () => {
  const newTheme = theme.global.current.value.dark ? "light" : "dark";
  theme.global.name.value = newTheme;

  // 保存主题设置到electron-store
  try {
    // 先获取现有设置
    const existingSettings = await window.electronAPI.getSettings();
    // 合并设置，只更新主题
    const updatedSettings = {
      ...existingSettings,
      theme: newTheme,
    };
    await window.electronAPI.saveSettings(updatedSettings);
  } catch (error) {
    console.error("保存主题设置失败:", error);
  }
};

// 在组件挂载时加载保存的主题
const loadSavedTheme = async () => {
  try {
    const savedSettings = await window.electronAPI.getSettings();
    if (
      savedSettings &&
      savedSettings.theme &&
      (savedSettings.theme === "light" || savedSettings.theme === "dark")
    ) {
      theme.global.name.value = savedSettings.theme;
    }
  } catch (error) {
    console.error("加载主题设置失败:", error);
  }
};

onMounted(() => {
  loadSavedTheme();
});

const openSettings = () => {
  router.push("/settings");
};

const isSettingsPage = computed(() => {
  return route.path === "/settings";
});

const isDesignPage = computed(() => {
  return route.path === "/design";
});

const goBack = () => {
  router.back();
};

const goBackToEpisodeList = () => {
  // 从查询参数中获取项目ID，返回到剧集列表
  const projectId = route.query.projectId;
  if (projectId) {
    router.push(`/episodes/${projectId}`);
  } else {
    // 如果没有项目ID，返回到项目列表
    router.push("/");
  }
};
</script>

<style scoped>
.v-navigation-drawer {
  transition: width 0.2s ease-in-out;
}
</style>
