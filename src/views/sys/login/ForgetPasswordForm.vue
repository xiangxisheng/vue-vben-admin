<template>
  <template v-if="getShow">
    <LoginFormTitle class="enter-x" />
    <Form class="p-4 enter-x" :model="formData" :rules="getFormRules" ref="formRef">
      <FormItem v-if="0" name="account" class="enter-x">
        <Input
          size="large"
          v-model:value="formData.account"
          :placeholder="t('sys.login.userName')"
        />
      </FormItem>
      <FormItem name="email" class="enter-x">
        <Input
          size="large"
          v-model:value="formData.email"
          :placeholder="t('sys.login.email')"
          class="fix-auto-fill"
        />
      </FormItem>
      <FormItem name="otp_code" class="enter-x">
        <CountdownInput
          size="large"
          class="fix-auto-fill"
          v-model:value="formData.otp_code"
          :placeholder="t('sys.login.otpPlaceholder')"
          :count="10"
          :sendCodeApi="handleSendCodeApi"
        />
      </FormItem>
      <FormItem v-if="0" name="mobile" class="enter-x">
        <Input size="large" v-model:value="formData.mobile" :placeholder="t('sys.login.mobile')" />
      </FormItem>
      <FormItem v-if="0" name="sms" class="enter-x">
        <CountdownInput
          size="large"
          v-model:value="formData.sms"
          :placeholder="t('sys.login.smsCode')"
        />
      </FormItem>
      <FormItem name="password" class="enter-x">
        <StrengthMeter
          size="large"
          v-model:value="formData.password"
          :placeholder="t('sys.login.password')"
        />
      </FormItem>
      <FormItem name="confirmPassword" class="enter-x">
        <InputPassword
          size="large"
          visibilityToggle
          v-model:value="formData.confirmPassword"
          :placeholder="t('sys.login.confirmPassword')"
        />
      </FormItem>

      <FormItem class="enter-x">
        <Button type="primary" size="large" block @click="handleReset" :loading="loading">
          {{ t('common.resetText') }}
        </Button>
        <Button size="large" block class="mt-4" @click="handleBackLogin">
          {{ t('sys.login.backSignIn') }}
        </Button>
      </FormItem>
    </Form>
  </template>
</template>
<script lang="ts" setup>
  import { reactive, ref, computed, unref } from 'vue';
  import LoginFormTitle from './LoginFormTitle.vue';
  import { Form, Input, Button } from 'ant-design-vue';
  import { StrengthMeter } from '@/components/StrengthMeter';
  import { CountdownInput } from '@/components/CountDown';
  import { useI18n } from '@/hooks/web/useI18n';
  import { useLoginState, useFormRules, useFormValid, LoginStateEnum } from './useLogin';
  import { Api } from '@/api';
  import { useMessage } from '@/hooks/web/useMessage';
  const { createSuccessModal, createErrorModal } = useMessage();

  const FormItem = Form.Item;
  const InputPassword = Input.Password;

  const { t } = useI18n();
  const { handleBackLogin, getLoginState } = useLoginState();
  const formRef = ref();
  const loading = ref(false);


  const formData = reactive({
    //account: '',
    //mobile: '',
    //sms: '',
    email: '',
    otp_code: '',
    password: '',
    confirmPassword: '',
  });

  const { getFormRules } = useFormRules(formData);
  const { validForm } = useFormValid(formRef);

  const getShow = computed(() => unref(getLoginState) === LoginStateEnum.RESET_PASSWORD);

  async function handleReset() {
    const form = unref(formRef);
    if (!form) return;
    //await form.resetFields();
    const data = await validForm();
    if (!data) return;
    try {
      loading.value = true;
      const result = await Api('/public/email/resetpwd', {
        email: formData.email,
        otp_code: formData.otp_code,
        password: formData.password,
      });
      console.log(result);
    } catch (error) {
      console.error(error);
      return;
    } finally {
      loading.value = false;
    }
    return true;
    console.log(data);
  }

  async function handleSendCodeApi() {
    if (!formData.email) {
      createErrorModal({
        title: t('sys.api.errorTip'),
        content: '请先填写E-mail邮箱',
      });
      return;
    }
    try {
      loading.value = true;
      const result = await Api('/public/email/otp', {
        action: 'resetpwd',
        email: formData.email,
      });
      console.log(result);
    } catch (error) {
      console.error(error);
      return;
    } finally {
      loading.value = false;
    }
    return true;
  }
</script>
