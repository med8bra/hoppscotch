<template>
  <div v-if="isExtensionSelected" class="flex items-center space-x-2">
    <template v-if="showExtensionStatus">
      <span class="text-red-500">{{ t("interceptor.extension.not_found") }}</span>
      <div class="flex space-x-2">
        <HoppButtonSecondary
          to="https://chrome.google.com/webstore/detail/hoppscotch-browser-extens/amknoiejhlmhancpahfcfcfhllgkpbld"
          blank
          :icon="IconChrome"
          outline
          class="!h-6 !w-6 !p-0"
          v-tippy="{ theme: 'tooltip', content: t('interceptor.extension.chrome') }"
        />
        <HoppButtonSecondary
          to="https://addons.mozilla.org/en-US/firefox/addon/hoppscotch"
          blank
          :icon="IconFirefox"
          outline
          class="!h-6 !w-6 !p-0"
          v-tippy="{ theme: 'tooltip', content: t('interceptor.extension.firefox') }"
        />
      </div>
    </template>

    <template v-else>
      <span class="text-accent">{{ t("interceptor.extension.running") }}</span>
      <span class="text-secondaryLight text-tiny" v-if="extensionVersion">
        v{{ extensionVersion.major }}.{{ extensionVersion.minor }}
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useService } from "dioc/vue"
import { useI18n } from "@composables/i18n"
import { KernelInterceptorService } from "~/services/kernel-interceptor.service"
import { ExtensionKernelInterceptorService } from "~/platform/std/kernel-interceptors/extension"

import IconChrome from "~icons/brands/chrome"
import IconFirefox from "~icons/brands/firefox"

const t = useI18n()
const interceptorService = useService(KernelInterceptorService)
const extensionService = useService(ExtensionKernelInterceptorService)

const isExtensionSelected = computed(() =>
  interceptorService.current.value?.id === "extension"
)

const showExtensionStatus = computed(() =>
  extensionService.extensionStatus.value !== 'available'
)

const extensionVersion = computed(() =>
  extensionService.extensionVersion.value
)
</script>
