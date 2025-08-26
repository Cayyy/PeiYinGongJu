import { createRouter, createWebHistory } from "vue-router";
import ProjectList from "@/views/ProjectList.vue";
import EpisodeList from "@/views/EpisodeList.vue";
import DesignScript from "@/views/DesignScript.vue";
import CharacterAssignment from "@/views/CharacterAssignment.vue";
import DubbingGeneration from "@/views/DubbingGeneration.vue";
import Settings from "@/views/Settings.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "ProjectList",
      component: ProjectList,
      meta: { title: "项目列表" },
    },
    {
      path: "/episodes/:projectId",
      name: "EpisodeList",
      component: EpisodeList,
      meta: { title: "剧集列表" },
    },
    {
      path: "/design",
      name: "DesignScript",
      component: DesignScript,
      meta: { title: "设计文案" },
    },
    {
      path: "/characters",
      name: "CharacterAssignment",
      component: CharacterAssignment,
      meta: { title: "角色分配" },
    },
    {
      path: "/dubbing",
      name: "DubbingGeneration",
      component: DubbingGeneration,
      meta: { title: "配音生成" },
    },
    {
      path: "/settings",
      name: "Settings",
      component: Settings,
      meta: { title: "设置" },
    },
  ],
});

export default router;
