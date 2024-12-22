<template>
  <div v-if="isAgentSelected" class="flex items-center space-x-2">
    <div
      v-if="showAgentNotRunning"
      class="flex items-center justify-between w-full space-x-2"
    >
      <span class="ml-12">{{ t("settings.agent_not_running_short") }}</span>
      <HoppButtonSecondary
        v-tippy="{ theme: 'tooltip' }"
        :title="t('action.retry')"
        :icon="IconRefresh"
        outline
        class="!h-6 !w-6 !p-0"
        @click="checkAgentStatus"
      />
    </div>

    <div
      v-else-if="showAgentRunning"
      class="flex items-center justify-between w-full space-x-2"
    >
      <span class="ml-12 text-accent">{{
        t("settings.agent_running_short")
      }}</span>
      <HoppButtonSecondary
        v-tippy="{ theme: 'tooltip' }"
        :title="t('action.register')"
        :icon="IconPlus"
        outline
        class="!h-6 !w-6 !p-0"
        @click="initiateRegistration"
      />
    </div>

    <template v-else-if="showRegistrationOTP">
      <HoppSmartInput
        v-model="registrationOTP"
        :placeholder="' '"
        :disabled="isRegistering"
        class="ml-12 w-full !w-44"
      />
      <HoppButtonSecondary
        v-tippy="{ theme: 'tooltip' }"
        :title="t('action.confirm')"
        :icon="IconCheck"
        :loading="isRegistering"
        outline
        class="!h-6 !w-6 !p-0"
        @click="register"
      />
    </template>

    <template v-else>
      <div class="ml-12 p-2 text-secondaryLight truncate w-full">
        {{ maskedAuthKey }}
      </div>
      <HoppButtonSecondary
        v-tippy="{ theme: 'tooltip' }"
        :title="t('settings.agent_reset_registration')"
        :icon="IconRotateCCW"
        outline
        class="!h-6 !w-6 !p-0"
        @click="resetRegistration"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useService } from "dioc/vue"
import { useI18n } from "@composables/i18n"
import { useToast } from "@composables/toast"
import { KernelInterceptorService } from "~/services/kernel-interceptor.service"
import { KernelInterceptorAgentStore } from "~/platform/std/kernel-interceptors/agent/store"

import IconRotateCCW from "~icons/lucide/rotate-ccw"
import IconPlus from "~icons/lucide/plus"
import IconCheck from "~icons/lucide/check"
import IconRefresh from "~icons/lucide/refresh-cw"

const t = useI18n()
const toast = useToast()
const interceptorService = useService(KernelInterceptorService)
const store = useService(KernelInterceptorAgentStore)

const isAgentSelected = computed(
  () => interceptorService.current.value?.id === "agent"
)

const showAgentNotRunning = computed(
  () => !store.authKey.value && !store.isAgentRunning.value
)

const showAgentRunning = computed(
  () => !store.authKey.value && !hasInitiatedRegistration.value
)

const showRegistrationOTP = computed(() => !store.authKey.value)

const hasInitiatedRegistration = ref(false)
const registrationOTP = ref("")
const isRegistering = ref(false)
const maskedAuthKey = ref("")

async function checkAgentStatus() {
  try {
    await store.checkAgentStatus()
    if (!store.isAgentRunning.value) {
      toast.error(t("settings.agent_not_running"))
    }
  } catch (e) {
    toast.error(t("settings.agent_check_failed"))
  }
}

async function initiateRegistration() {
  try {
    await store.initiateRegistration()
    hasInitiatedRegistration.value = true
  } catch (e) {
    toast.error(t("settings.registration_failed"))
  }
}

async function register() {
  if (!registrationOTP.value) return
  isRegistering.value = true
  try {
    await store.verifyRegistration(registrationOTP.value)
    await updateMaskedAuthKey()
    toast.success(t("settings.agent_registration_successful"))
    registrationOTP.value = ""
  } catch (e) {
    toast.error(t("settings.registration_failed"))
  } finally {
    isRegistering.value = false
  }
}

function resetRegistration() {
  store.authKey.value = null
  maskedAuthKey.value = ""
  registrationOTP.value = ""
  hasInitiatedRegistration.value = false
}

async function updateMaskedAuthKey() {
  if (!store.authKey.value) return
  try {
    const registration = await store.fetchRegistrationInfo()
    maskedAuthKey.value = registration.auth_key_hash
  } catch (e) {
    toast.error(t("settings.registration_fetch_failed"))
  }
}
</script>
