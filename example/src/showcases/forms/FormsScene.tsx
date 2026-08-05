import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Checkbox,
  Form,
  FormGroup,
  FormRow,
  Input,
  PasswordInput,
  Radio,
  Search,
  Stepper,
  Switch,
  Textarea,
  type ColorTokens,
  type TextFieldHandle,
  space,
  type,
  useThemedStyles,
} from '@unif/react-native-design';
import { ShowcaseScaffold } from '../../shared/ShowcaseScaffold';
import { SectionCard } from '../../shared/SectionCard';
import { useShowcase } from '../../state/useShowcase';

const TEXTAREA_MAX_LENGTH = 40;

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    stack: {
      gap: space['7'],
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space['5'],
    },
    controls: {
      gap: space['4'],
    },
    status: {
      color: colors.foregroundMuted,
      fontSize: type.sm,
    },
  });

export function FormsScene(): React.JSX.Element {
  const { appendResult, back, state, updateScene } = useShowcase();
  const styles = useThemedStyles(makeStyles);
  const draft = state.scenes.forms;
  const refInput = useRef<TextFieldHandle>(null);
  const [refStatus, setRefStatus] = useState('等待操作');
  const [localSpecimenRevision, setLocalSpecimenRevision] = useState(0);
  const record = (component: string, action: string, summary: string) => {
    appendResult({ scene: 'forms', component, action, summary });
  };

  return (
    <ShowcaseScaffold
      title="表单与输入"
      scene="forms"
      onBack={() => {
        back();
      }}
      onReset={() => {
        setLocalSpecimenRevision((revision) => revision + 1);
        setRefStatus('等待操作');
      }}
      testID="forms-screen"
    >
      <View style={styles.stack}>
        <SectionCard
          title="文本输入"
          description="受控姓名与非受控备注分别保持固定模式，切换场景后恢复草稿。"
        >
          <View style={styles.controls}>
            <Input
              value={draft.inputValue}
              onChangeText={(inputValue) => {
                updateScene('forms', (current) => ({
                  ...current,
                  inputValue,
                }));
              }}
              leading={{ kind: 'icon', icon: 'user', size: 18 }}
              trailing={{
                kind: 'action',
                icon: 'close',
                accessibilityLabel: '清除姓名',
                onPress: () => {
                  updateScene('forms', (current) => ({
                    ...current,
                    inputValue: '',
                  }));
                  record('Input', '清除', '姓名草稿已清除');
                },
              }}
              placeholder="请输入姓名"
              accessibilityLabel="姓名"
              testID="forms-input-controlled"
            />
            <Textarea
              key={localSpecimenRevision}
              defaultValue={draft.textareaValue}
              onChangeText={(textareaValue) => {
                updateScene('forms', (current) => ({
                  ...current,
                  textareaValue,
                }));
              }}
              leading={{ kind: 'text', value: '备注' }}
              trailing={{ kind: 'icon', icon: 'edit', size: 18 }}
              placeholder="请输入拜访备注"
              accessibilityLabel="拜访备注"
              minHeight={96}
              maxHeight={180}
              maxLength={TEXTAREA_MAX_LENGTH}
              testID="forms-textarea-uncontrolled"
            />
          </View>
        </SectionCard>

        <SectionCard title="输入状态">
          <View style={styles.controls}>
            <Input
              key={localSpecimenRevision}
              defaultValue=""
              placeholder="空闲状态"
              trailing={{ kind: 'text', value: '选填' }}
              accessibilityLabel="空闲输入"
              testID="forms-input-idle"
            />
            <Input
              value="已填写"
              onChangeText={() => {}}
              editable
              accessibilityLabel="已填写输入"
              testID="forms-input-filled"
            />
            <Input
              value=""
              onChangeText={() => {}}
              error="字段格式不正确"
              accessibilityLabel="错误输入"
              testID="forms-input-error"
            />
            <Input
              value=""
              onChangeText={() => {}}
              disabled
              editable
              trailing={{
                kind: 'action',
                icon: 'close',
                accessibilityLabel: '禁用输入操作',
                onPress: () => record('Input', '操作槽', '禁用输入操作已触发'),
              }}
              accessibilityLabel="禁用输入"
              testID="forms-input-disabled"
            />
            <Input
              value="只读内容"
              onChangeText={() => {}}
              editable={false}
              accessibilityLabel="只读输入"
              testID="forms-input-readonly"
            />
            <Textarea
              value=""
              onChangeText={() => {}}
              error="备注需要补充"
              accessibilityLabel="错误备注"
              testID="forms-textarea-error"
            />
            <Textarea
              value=""
              onChangeText={() => {}}
              disabled
              accessibilityLabel="禁用备注"
              testID="forms-textarea-disabled"
            />
            <Textarea
              value="只读备注"
              onChangeText={() => {}}
              editable={false}
              accessibilityLabel="只读备注"
              testID="forms-textarea-readonly"
            />
            <Textarea
              value={draft.textareaValue}
              onChangeText={(textareaValue) => {
                updateScene('forms', (current) => ({
                  ...current,
                  textareaValue,
                }));
              }}
              maxLength={TEXTAREA_MAX_LENGTH}
              accessibilityLabel="字数限制备注"
              testID="forms-textarea-max-length"
            />
            <Text style={styles.status} testID="forms-textarea-counter">
              字数：{draft.textareaValue.length}/{TEXTAREA_MAX_LENGTH}
            </Text>
          </View>
        </SectionCard>

        <SectionCard
          title="密码与搜索"
          description="页面只记录字符数和状态，不记录密码或搜索正文。"
        >
          <View style={styles.controls}>
            <PasswordInput
              value={draft.passwordValue}
              onChangeText={(passwordValue) => {
                updateScene('forms', (current) => ({
                  ...current,
                  passwordValue,
                }));
              }}
              accessibilityLabel="登录密码"
              testID="forms-password"
            />
            <View style={styles.row}>
              <Button
                label="记录密码状态"
                variant="secondary"
                onPress={() =>
                  record(
                    'PasswordInput',
                    '检查',
                    `已输入 ${draft.passwordValue.length} 个字符`
                  )
                }
              />
            </View>
            <PasswordInput
              value=""
              onChangeText={() => {}}
              error="密码格式不正确"
              accessibilityLabel="错误密码"
              testID="forms-password-error"
            />
            <PasswordInput
              value=""
              onChangeText={() => {}}
              disabled
              editable
              accessibilityLabel="禁用密码"
              testID="forms-password-disabled"
            />
            <PasswordInput
              value=""
              onChangeText={() => {}}
              editable={false}
              accessibilityLabel="只读密码"
              testID="forms-password-readonly"
            />
            <Search
              value={draft.searchValue}
              onChangeText={(searchValue) => {
                updateScene('forms', (current) => ({
                  ...current,
                  searchValue,
                }));
              }}
              onSubmit={(value) =>
                record('Search', '提交', `已提交 ${value.length} 个字符`)
              }
              placeholder="搜索组件"
              accessibilityLabel="组件搜索"
              testID="forms-search"
            />
            <Search
              key={localSpecimenRevision}
              defaultValue=""
              placeholder="非受控搜索"
              accessibilityLabel="非受控组件搜索"
              testID="forms-search-uncontrolled"
            />
            <Search
              value=""
              onChangeText={() => {}}
              disabled
              accessibilityLabel="禁用搜索"
              testID="forms-search-disabled"
            />
          </View>
        </SectionCard>

        <SectionCard title="选择控件">
          <View style={styles.controls}>
            <Checkbox
              checked={draft.checkboxChecked}
              onChange={(checkboxChecked) => {
                updateScene('forms', (current) => ({
                  ...current,
                  checkboxChecked,
                }));
                record(
                  'Checkbox',
                  '切换',
                  checkboxChecked ? '提醒已开启' : '提醒已关闭'
                );
              }}
              label="接收提醒"
              testID="forms-checkbox"
            />
            <Checkbox
              checked
              onChange={() => record('Checkbox', '切换', '禁用项已触发')}
              label="禁用复选框"
              disabled
              testID="forms-checkbox-disabled"
            />
            <Radio.Group
              value={draft.radioValue}
              onChange={(value) => {
                if (typeof value !== 'string') return;
                updateScene('forms', (current) => ({
                  ...current,
                  radioValue: value,
                }));
                record(
                  'Radio',
                  '选择',
                  value === 'first' ? '已选择电话' : '已选择短信'
                );
              }}
              accessibilityLabel="联系偏好"
              testID="forms-radio-group"
            >
              <Radio value="first" label="电话" />
              <Radio value="second" label="短信" />
              <Radio value="third" label="邮件" disabled />
            </Radio.Group>
            <Switch
              value={draft.switchValue}
              onChange={(switchValue) => {
                updateScene('forms', (current) => ({
                  ...current,
                  switchValue,
                }));
                record(
                  'Switch',
                  '切换',
                  switchValue ? '草稿同步已开启' : '草稿同步已关闭'
                );
              }}
              accessibilityLabel="同步草稿"
              testID="forms-switch"
            />
            <Switch
              value
              onChange={() => record('Switch', '切换', '禁用开关已触发')}
              accessibilityLabel="禁用开关"
              disabled
              testID="forms-switch-disabled"
            />
          </View>
        </SectionCard>

        <SectionCard title="数字步进">
          <View style={styles.controls}>
            <Stepper
              value={draft.stepperValue}
              onChange={(stepperValue) => {
                updateScene('forms', (current) => ({
                  ...current,
                  stepperValue,
                }));
                record('Stepper', '调整', '数量已更新');
              }}
              min={0}
              max={10}
              step={2}
              size="md"
              accessibilityLabel="数量"
              testID="forms-stepper-main"
            />
            <Stepper
              value={5}
              onChange={() => {}}
              min={0}
              max={10}
              size="sm"
              accessibilityLabel="中间值"
              testID="forms-stepper-small"
            />
            <Stepper
              value={10}
              onChange={() => {}}
              min={0}
              max={10}
              accessibilityLabel="最大值"
              testID="forms-stepper-max"
            />
            <Stepper
              value={4}
              onChange={() => {}}
              min={4}
              max={4}
              accessibilityLabel="零范围"
              testID="forms-stepper-zero"
            />
            <Stepper
              value={3}
              onChange={() => record('Stepper', '调整', '禁用步进已触发')}
              disabled
              accessibilityLabel="禁用数量"
              testID="forms-stepper-disabled"
            />
          </View>
        </SectionCard>

        <SectionCard title="表单组合">
          <Form testID="forms-form">
            <FormGroup label="客户资料" testID="forms-form-group">
              <FormRow
                label="客户名称"
                required
                error="请输入客户名称"
                testID="forms-form-row-name"
              >
                <Input
                  value=""
                  onChangeText={() => {}}
                  accessibilityLabel="表单客户名称"
                />
              </FormRow>
              <FormRow label="同步" testID="forms-form-row-switch">
                <Switch
                  value={draft.switchValue}
                  onChange={(switchValue) => {
                    updateScene('forms', (current) => ({
                      ...current,
                      switchValue,
                    }));
                  }}
                  accessibilityLabel="表单同步开关"
                />
              </FormRow>
            </FormGroup>
            <FormGroup testID="forms-form-group-secondary">
              <FormRow label="确认" testID="forms-form-row-confirm">
                <Checkbox
                  checked={draft.checkboxChecked}
                  onChange={(checkboxChecked) => {
                    updateScene('forms', (current) => ({
                      ...current,
                      checkboxChecked,
                    }));
                  }}
                  label="资料已核对"
                />
              </FormRow>
            </FormGroup>
          </Form>
          <Form testID="forms-form-single">
            <FormGroup label="单组示例" testID="forms-form-single-group">
              <FormRow label="备注" testID="forms-form-single-row">
                <Input
                  key={localSpecimenRevision}
                  defaultValue=""
                  accessibilityLabel="单组备注"
                  testID="forms-form-single-note"
                />
              </FormRow>
            </FormGroup>
          </Form>
        </SectionCard>

        <SectionCard
          title="窄引用"
          description="公开引用只演示聚焦与失焦，不暴露清除或原生属性写入。"
        >
          <Input
            key={localSpecimenRevision}
            ref={refInput}
            defaultValue=""
            onFocus={() => setRefStatus('已聚焦')}
            onBlur={() => setRefStatus('已失焦')}
            accessibilityLabel="Ref 演示输入"
            testID="forms-ref-input"
          />
          <View style={styles.row}>
            <Button
              label="聚焦演示输入"
              variant="secondary"
              testID="forms-ref-focus"
              onPress={() => {
                refInput.current?.focus();
                setRefStatus('已聚焦');
              }}
            />
            <Button
              label="移开演示输入"
              variant="secondary"
              testID="forms-ref-blur"
              onPress={() => {
                refInput.current?.blur();
                setRefStatus('已失焦');
              }}
            />
          </View>
          <Text style={styles.status}>引用状态：{refStatus}</Text>
        </SectionCard>
      </View>
    </ShowcaseScaffold>
  );
}
