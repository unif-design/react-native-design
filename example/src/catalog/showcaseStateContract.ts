import type { PublicComponentId, SceneId } from './componentCatalog';

export type StateWitnessScalar = string | number | boolean;

type KebabCase<
  Value extends string,
  IsFirst extends boolean = true,
> = Value extends `${infer Head}${infer Tail}`
  ? Head extends Lowercase<Head>
    ? `${Head}${KebabCase<Tail, false>}`
    : `${IsFirst extends true ? '' : '-'}${Lowercase<Head>}${KebabCase<
        Tail,
        false
      >}`
  : '';

export type JsxPropsStateWitness = Readonly<{
  kind: 'jsx-props';
  targetComponent?: PublicComponentId;
  specimens: readonly Readonly<{
    testID?: string;
    props: Readonly<Record<string, StateWitnessScalar>>;
    presentProps?: readonly string[];
  }>[];
}>;

export type InteractionStateWitness = Readonly<{
  kind: 'interaction';
  targetComponent: PublicComponentId;
  testID: string;
  handler:
    | 'onPress'
    | 'onOverflowPress'
    | 'onChange'
    | 'onChangeText'
    | 'onValueChange';
  calls: readonly string[];
  rootHost?: 'ConfirmHost' | 'ToastHost';
}>;

export type RuntimeApiStateWitness = Readonly<{
  kind: 'runtime-api';
  calls: readonly [string, ...string[]];
  rootHost?: 'ConfirmHost' | 'ToastHost';
}>;

export type ShowcaseStateContractEntry = {
  [Component in PublicComponentId]: Readonly<{
    id: `${KebabCase<Component>}.${string}`;
    component: Component;
    scene: SceneId;
    label: string;
    witness:
      | JsxPropsStateWitness
      | InteractionStateWitness
      | RuntimeApiStateWitness;
  }>;
}[PublicComponentId];

export const showcaseStateContract = [
  {
    id: 'icon.all-icons',
    component: 'Icon',
    scene: 'foundation',
    label: '图标全集',
    witness: {
      kind: 'jsx-props',
      specimens: [{ props: {}, presentProps: ['name'] }],
    },
  },
  {
    id: 'icon.name-search',
    component: 'Icon',
    scene: 'foundation',
    label: '名称检索',
    witness: {
      kind: 'interaction',
      targetComponent: 'Search',
      testID: 'foundation-icon-search',
      handler: 'onChangeText',
      calls: [],
    },
  },
  {
    id: 'icon.sizes',
    component: 'Icon',
    scene: 'foundation',
    label: '尺寸',
    witness: {
      kind: 'interaction',
      targetComponent: 'Segmented',
      testID: 'foundation-icon-size',
      handler: 'onChange',
      calls: [],
    },
  },
  {
    id: 'icon.color',
    component: 'Icon',
    scene: 'foundation',
    label: '颜色',
    witness: {
      kind: 'jsx-props',
      specimens: [{ props: {}, presentProps: ['color'] }],
    },
  },
  {
    id: 'icon.a11y-hidden',
    component: 'Icon',
    scene: 'foundation',
    label: '无障碍隐藏',
    witness: {
      kind: 'jsx-props',
      specimens: [{ props: {}, presentProps: ['name'] }],
    },
  },
  {
    id: 'button.variants',
    component: 'Button',
    scene: 'actions',
    label: '变体',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'actions-button-variant-primary',
          props: { variant: 'primary' },
        },
        {
          testID: 'actions-button-variant-secondary',
          props: { variant: 'secondary' },
        },
        {
          testID: 'actions-button-variant-ghost',
          props: { variant: 'ghost' },
        },
        {
          testID: 'actions-button-variant-neutral',
          props: { variant: 'neutral' },
        },
        {
          testID: 'actions-button-variant-outline',
          props: { variant: 'outline' },
        },
        {
          testID: 'actions-button-variant-danger',
          props: { variant: 'danger' },
        },
        {
          testID: 'actions-button-variant-text',
          props: { variant: 'text' },
        },
      ],
    },
  },
  {
    id: 'button.sizes',
    component: 'Button',
    scene: 'actions',
    label: '尺寸',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'actions-button-size-sm', props: { size: 'sm' } },
        { testID: 'actions-button-size-md', props: { size: 'md' } },
        { testID: 'actions-button-size-lg', props: { size: 'lg' } },
      ],
    },
  },
  {
    id: 'button.block',
    component: 'Button',
    scene: 'actions',
    label: '通栏',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'actions-button-icons', props: { block: true } }],
    },
  },
  {
    id: 'button.leading-trailing-icons',
    component: 'Button',
    scene: 'actions',
    label: '前后图标',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'actions-button-icons',
          props: { leftIcon: 'check', rightIcon: 'arrow-right' },
        },
      ],
    },
  },
  {
    id: 'button.disabled',
    component: 'Button',
    scene: 'actions',
    label: '禁用',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'actions-button-disabled',
          props: { disabled: true },
        },
      ],
    },
  },
  {
    id: 'button.loading',
    component: 'Button',
    scene: 'actions',
    label: '加载',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'actions-button-loading', props: { loading: true } },
      ],
    },
  },
  {
    id: 'icon-button.variants',
    component: 'IconButton',
    scene: 'actions',
    label: '变体',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'actions-icon-button-variant-primary',
          props: { variant: 'primary' },
        },
        {
          testID: 'actions-icon-button-variant-secondary',
          props: { variant: 'secondary' },
        },
        {
          testID: 'actions-icon-button-variant-ghost',
          props: { variant: 'ghost' },
        },
        {
          testID: 'actions-icon-button-variant-neutral',
          props: { variant: 'neutral' },
        },
        {
          testID: 'actions-icon-button-variant-outline',
          props: { variant: 'outline' },
        },
        {
          testID: 'actions-icon-button-variant-danger',
          props: { variant: 'danger' },
        },
      ],
    },
  },
  {
    id: 'icon-button.sizes',
    component: 'IconButton',
    scene: 'actions',
    label: '尺寸',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'actions-icon-button-size-sm', props: { size: 'sm' } },
        { testID: 'actions-icon-button-size-md', props: { size: 'md' } },
        { testID: 'actions-icon-button-size-lg', props: { size: 'lg' } },
      ],
    },
  },
  {
    id: 'icon-button.a11y-name',
    component: 'IconButton',
    scene: 'actions',
    label: '无障碍名称',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'actions-icon-button-color',
          props: { accessibilityLabel: '自定义颜色图标按钮' },
        },
      ],
    },
  },
  {
    id: 'icon-button.disabled',
    component: 'IconButton',
    scene: 'actions',
    label: '禁用',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'actions-icon-button-disabled',
          props: { disabled: true },
        },
      ],
    },
  },
  {
    id: 'icon-button.loading',
    component: 'IconButton',
    scene: 'actions',
    label: '加载',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'actions-icon-button-loading',
          props: { loading: true },
        },
      ],
    },
  },
  {
    id: 'chip.static',
    component: 'Chip',
    scene: 'actions',
    label: '静态',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'actions-chip-static', props: {} }],
    },
  },
  {
    id: 'chip.clickable',
    component: 'Chip',
    scene: 'actions',
    label: '可点击',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'actions-chip-selectable',
          props: {},
          presentProps: ['onPress'],
        },
      ],
    },
  },
  {
    id: 'chip.unselected',
    component: 'Chip',
    scene: 'actions',
    label: '未选中',
    witness: {
      kind: 'interaction',
      targetComponent: 'Chip',
      testID: 'actions-chip-selectable',
      handler: 'onPress',
      calls: [],
    },
  },
  {
    id: 'chip.selected',
    component: 'Chip',
    scene: 'actions',
    label: '选中',
    witness: {
      kind: 'interaction',
      targetComponent: 'Chip',
      testID: 'actions-chip-selectable',
      handler: 'onPress',
      calls: [],
    },
  },
  {
    id: 'chip.icon-slots',
    component: 'Chip',
    scene: 'actions',
    label: '图标',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'actions-chip-slots', props: {} }],
    },
  },
  {
    id: 'chip.disabled',
    component: 'Chip',
    scene: 'actions',
    label: '禁用',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'actions-chip-disabled', props: { disabled: true } },
      ],
    },
  },
  {
    id: 'chip.busy',
    component: 'Chip',
    scene: 'actions',
    label: '处理中',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'actions-chip-busy', props: { busy: true } }],
    },
  },
  {
    id: 'tag.variants',
    component: 'Tag',
    scene: 'actions',
    label: '变体',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'actions-tag-neutral-md',
          props: { variant: 'neutral' },
        },
        { testID: 'actions-tag-brand-md', props: { variant: 'brand' } },
        {
          testID: 'actions-tag-success-md',
          props: { variant: 'success' },
        },
        { testID: 'actions-tag-error-md', props: { variant: 'error' } },
        { testID: 'actions-tag-info-md', props: { variant: 'info' } },
        {
          testID: 'actions-tag-outline-md',
          props: { variant: 'outline' },
        },
      ],
    },
  },
  {
    id: 'tag.sizes',
    component: 'Tag',
    scene: 'actions',
    label: '尺寸',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'actions-tag-neutral-md', props: { size: 'md' } },
        { testID: 'actions-tag-neutral-lg', props: { size: 'lg' } },
      ],
    },
  },
  {
    id: 'status-dot.statuses',
    component: 'StatusDot',
    scene: 'actions',
    label: 'pending/active/done/error',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'actions-status-pending-flat',
          props: { status: 'pending' },
        },
        {
          testID: 'actions-status-active-flat',
          props: { status: 'active' },
        },
        {
          testID: 'actions-status-done-flat',
          props: { status: 'done' },
        },
        {
          testID: 'actions-status-error-flat',
          props: { status: 'error' },
        },
      ],
    },
  },
  {
    id: 'status-dot.tones',
    component: 'StatusDot',
    scene: 'actions',
    label: 'flat/soft',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'actions-status-pending-flat',
          props: { tone: 'flat' },
        },
        {
          testID: 'actions-status-pending-soft',
          props: { tone: 'soft' },
        },
      ],
    },
  },
  {
    id: 'status-dot.sizes',
    component: 'StatusDot',
    scene: 'actions',
    label: '尺寸',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'actions-dot-size-12', props: { size: 12 } },
        { testID: 'actions-dot-size-18', props: { size: 18 } },
        { testID: 'actions-dot-size-24', props: { size: 24 } },
      ],
    },
  },
  {
    id: 'status-dot.a11y-name',
    component: 'StatusDot',
    scene: 'actions',
    label: '无障碍名称',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'actions-dot-size-18',
          props: { accessibilityLabel: '中尺寸进行状态' },
        },
      ],
    },
  },
  {
    id: 'input.controlled',
    component: 'Input',
    scene: 'forms',
    label: '受控',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'forms-input-controlled',
          props: {},
          presentProps: ['value', 'onChangeText'],
        },
      ],
    },
  },
  {
    id: 'input.uncontrolled',
    component: 'Input',
    scene: 'forms',
    label: '非受控',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'forms-input-idle', props: { defaultValue: '' } }],
    },
  },
  {
    id: 'input.idle',
    component: 'Input',
    scene: 'forms',
    label: '空闲',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'forms-input-idle',
          props: { placeholder: '空闲状态' },
        },
      ],
    },
  },
  {
    id: 'input.focus',
    component: 'Input',
    scene: 'forms',
    label: '聚焦',
    witness: {
      kind: 'interaction',
      targetComponent: 'Button',
      testID: 'forms-ref-focus',
      handler: 'onPress',
      calls: [],
    },
  },
  {
    id: 'input.filled',
    component: 'Input',
    scene: 'forms',
    label: '已填写',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'forms-input-filled', props: { value: '已填写' } }],
    },
  },
  {
    id: 'input.error',
    component: 'Input',
    scene: 'forms',
    label: '错误',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'forms-input-error', props: { error: '字段格式不正确' } },
      ],
    },
  },
  {
    id: 'input.disabled',
    component: 'Input',
    scene: 'forms',
    label: '禁用',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'forms-input-disabled', props: { disabled: true } },
      ],
    },
  },
  {
    id: 'input.editable',
    component: 'Input',
    scene: 'forms',
    label: '可编辑',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'forms-input-filled', props: { editable: true } }],
    },
  },
  {
    id: 'input.read-only',
    component: 'Input',
    scene: 'forms',
    label: '只读',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'forms-input-readonly', props: { editable: false } },
      ],
    },
  },
  {
    id: 'input.display-slots',
    component: 'Input',
    scene: 'forms',
    label: '前后展示槽',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'forms-input-controlled',
          props: {},
          presentProps: ['leading'],
        },
        {
          testID: 'forms-input-idle',
          props: {},
          presentProps: ['trailing'],
        },
      ],
    },
  },
  {
    id: 'input.action-slot',
    component: 'Input',
    scene: 'forms',
    label: '操作槽',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'forms-input-controlled',
          props: {},
          presentProps: ['trailing'],
        },
      ],
    },
  },
  {
    id: 'password-input.controlled',
    component: 'PasswordInput',
    scene: 'forms',
    label: '受控',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'forms-password',
          props: {},
          presentProps: ['value', 'onChangeText'],
        },
      ],
    },
  },
  {
    id: 'password-input.hidden',
    component: 'PasswordInput',
    scene: 'forms',
    label: '隐藏',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'forms-password', props: {} }],
    },
  },
  {
    id: 'password-input.visible',
    component: 'PasswordInput',
    scene: 'forms',
    label: '显示',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'forms-password', props: {} }],
    },
  },
  {
    id: 'password-input.error',
    component: 'PasswordInput',
    scene: 'forms',
    label: '错误',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'forms-password-error',
          props: { error: '密码格式不正确' },
        },
      ],
    },
  },
  {
    id: 'password-input.disabled',
    component: 'PasswordInput',
    scene: 'forms',
    label: '禁用',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'forms-password-disabled', props: { disabled: true } },
      ],
    },
  },
  {
    id: 'password-input.safe-result',
    component: 'PasswordInput',
    scene: 'forms',
    label: '安全结果',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'forms-password', props: {} }],
    },
  },
  {
    id: 'textarea.controlled',
    component: 'Textarea',
    scene: 'forms',
    label: '受控',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'forms-textarea-max-length',
          props: {},
          presentProps: ['value', 'onChangeText'],
        },
      ],
    },
  },
  {
    id: 'textarea.uncontrolled',
    component: 'Textarea',
    scene: 'forms',
    label: '非受控',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'forms-textarea-uncontrolled',
          props: {},
          presentProps: ['defaultValue'],
        },
      ],
    },
  },
  {
    id: 'textarea.error',
    component: 'Textarea',
    scene: 'forms',
    label: '错误',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'forms-textarea-error', props: { error: '备注需要补充' } },
      ],
    },
  },
  {
    id: 'textarea.disabled',
    component: 'Textarea',
    scene: 'forms',
    label: '禁用',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'forms-textarea-disabled', props: { disabled: true } },
      ],
    },
  },
  {
    id: 'textarea.max-length',
    component: 'Textarea',
    scene: 'forms',
    label: '字数限制',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'forms-textarea-max-length',
          props: {},
          presentProps: ['maxLength'],
        },
      ],
    },
  },
  {
    id: 'search.controlled',
    component: 'Search',
    scene: 'forms',
    label: '受控',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'forms-search',
          props: {},
          presentProps: ['value', 'onChangeText'],
        },
      ],
    },
  },
  {
    id: 'search.uncontrolled',
    component: 'Search',
    scene: 'forms',
    label: '非受控',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'forms-search-uncontrolled', props: { defaultValue: '' } },
      ],
    },
  },
  {
    id: 'search.clear',
    component: 'Search',
    scene: 'forms',
    label: '清除',
    witness: {
      kind: 'interaction',
      targetComponent: 'Search',
      testID: 'forms-search',
      handler: 'onChangeText',
      calls: [],
    },
  },
  {
    id: 'search.disabled',
    component: 'Search',
    scene: 'forms',
    label: '禁用',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'forms-search-disabled', props: { disabled: true } },
      ],
    },
  },
  {
    id: 'search.submit',
    component: 'Search',
    scene: 'forms',
    label: '提交',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'forms-search', props: {}, presentProps: ['onSubmit'] },
      ],
    },
  },
  {
    id: 'checkbox.unchecked',
    component: 'Checkbox',
    scene: 'forms',
    label: '未选中',
    witness: {
      kind: 'interaction',
      targetComponent: 'Checkbox',
      testID: 'forms-checkbox',
      handler: 'onChange',
      calls: [],
    },
  },
  {
    id: 'checkbox.checked',
    component: 'Checkbox',
    scene: 'forms',
    label: '选中',
    witness: {
      kind: 'interaction',
      targetComponent: 'Checkbox',
      testID: 'forms-checkbox',
      handler: 'onChange',
      calls: [],
    },
  },
  {
    id: 'checkbox.disabled',
    component: 'Checkbox',
    scene: 'forms',
    label: '禁用',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'forms-checkbox-disabled', props: { disabled: true } },
      ],
    },
  },
  {
    id: 'checkbox.a11y-state',
    component: 'Checkbox',
    scene: 'forms',
    label: '无障碍状态',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'forms-checkbox', props: {}, presentProps: ['checked'] },
      ],
    },
  },
  {
    id: 'radio.unchecked',
    component: 'Radio',
    scene: 'forms',
    label: '未选中',
    witness: { kind: 'jsx-props', specimens: [{ props: { value: 'second' } }] },
  },
  {
    id: 'radio.checked',
    component: 'Radio',
    scene: 'forms',
    label: '选中',
    witness: { kind: 'jsx-props', specimens: [{ props: { value: 'first' } }] },
  },
  {
    id: 'radio.group',
    component: 'Radio',
    scene: 'forms',
    label: '分组',
    witness: { kind: 'jsx-props', specimens: [{ props: { value: 'first' } }] },
  },
  {
    id: 'radio.disabled',
    component: 'Radio',
    scene: 'forms',
    label: '禁用',
    witness: {
      kind: 'jsx-props',
      specimens: [{ props: { value: 'third', disabled: true } }],
    },
  },
  {
    id: 'switch.off',
    component: 'Switch',
    scene: 'forms',
    label: '关闭',
    witness: {
      kind: 'interaction',
      targetComponent: 'Switch',
      testID: 'forms-switch',
      handler: 'onChange',
      calls: [],
    },
  },
  {
    id: 'switch.on',
    component: 'Switch',
    scene: 'forms',
    label: '开启',
    witness: {
      kind: 'interaction',
      targetComponent: 'Switch',
      testID: 'forms-switch',
      handler: 'onChange',
      calls: [],
    },
  },
  {
    id: 'switch.disabled',
    component: 'Switch',
    scene: 'forms',
    label: '禁用',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'forms-switch-disabled', props: { disabled: true } },
      ],
    },
  },
  {
    id: 'stepper.min',
    component: 'Stepper',
    scene: 'forms',
    label: '最小值',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'forms-stepper-main', props: { min: 0 } }],
    },
  },
  {
    id: 'stepper.mid',
    component: 'Stepper',
    scene: 'forms',
    label: '中间值',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'forms-stepper-small', props: { value: 5 } }],
    },
  },
  {
    id: 'stepper.max',
    component: 'Stepper',
    scene: 'forms',
    label: '最大值',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'forms-stepper-max', props: { value: 10, max: 10 } },
      ],
    },
  },
  {
    id: 'stepper.step',
    component: 'Stepper',
    scene: 'forms',
    label: '步长',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'forms-stepper-main', props: { step: 2 } }],
    },
  },
  {
    id: 'stepper.zero-range',
    component: 'Stepper',
    scene: 'forms',
    label: '零范围',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'forms-stepper-zero',
          props: { value: 4, min: 4, max: 4 },
        },
      ],
    },
  },
  {
    id: 'stepper.disabled',
    component: 'Stepper',
    scene: 'forms',
    label: '禁用',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'forms-stepper-disabled', props: { disabled: true } },
      ],
    },
  },
  {
    id: 'stepper.sizes',
    component: 'Stepper',
    scene: 'forms',
    label: '尺寸',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'forms-stepper-main', props: { size: 'md' } },
        { testID: 'forms-stepper-small', props: { size: 'sm' } },
        { testID: 'forms-stepper-compact', props: { size: 'xs' } },
      ],
    },
  },
  {
    id: 'stepper.format-value',
    component: 'Stepper',
    scene: 'forms',
    label: '格式化值',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'forms-stepper-compact', props: { formatValue: true } },
      ],
    },
  },
  {
    id: 'form.single-group',
    component: 'Form',
    scene: 'forms',
    label: '单分组',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'forms-form-single', props: {} }],
    },
  },
  {
    id: 'form.multi-group',
    component: 'Form',
    scene: 'forms',
    label: '多分组',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'forms-form', props: {} }],
    },
  },
  {
    id: 'form-group.labelled',
    component: 'FormGroup',
    scene: 'forms',
    label: '有标题',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'forms-form-group', props: { label: '客户资料' } }],
    },
  },
  {
    id: 'form-group.unlabelled',
    component: 'FormGroup',
    scene: 'forms',
    label: '无标题',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'forms-form-group-secondary', props: {} }],
    },
  },
  {
    id: 'form-row.default',
    component: 'FormRow',
    scene: 'forms',
    label: '默认',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'forms-form-row-switch', props: { label: '同步' } },
      ],
    },
  },
  {
    id: 'form-row.required',
    component: 'FormRow',
    scene: 'forms',
    label: '必填',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'forms-form-row-name', props: { required: true } }],
    },
  },
  {
    id: 'form-row.error',
    component: 'FormRow',
    scene: 'forms',
    label: '错误',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'forms-form-row-name', props: { error: '请输入客户名称' } },
      ],
    },
  },
  {
    id: 'form-row.a11y-control',
    component: 'FormRow',
    scene: 'forms',
    label: '无障碍控件',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'forms-form-row-confirm', props: {} }],
    },
  },
  {
    id: 'card.default',
    component: 'Card',
    scene: 'collections',
    label: 'default',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'collections-card-default', props: { variant: 'default' } },
      ],
    },
  },
  {
    id: 'ribbon.brand',
    component: 'Ribbon',
    scene: 'collections',
    label: 'brand',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'collections-ribbon-brand', props: { tone: 'brand' } },
      ],
    },
  },
  {
    id: 'ribbon.danger',
    component: 'Ribbon',
    scene: 'collections',
    label: 'danger',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'collections-ribbon-danger', props: { tone: 'danger' } },
      ],
    },
  },
  {
    id: 'ribbon.top-right',
    component: 'Ribbon',
    scene: 'collections',
    label: '右上定位',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'collections-ribbon-brand', props: {} }],
    },
  },
  {
    id: 'ribbon.a11y',
    component: 'Ribbon',
    scene: 'collections',
    label: '可选读屏文案',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'collections-ribbon-danger',
          props: { accessibilityLabel: '该商品未匹配' },
        },
      ],
    },
  },
  {
    id: 'card.plain',
    component: 'Card',
    scene: 'collections',
    label: 'plain',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'collections-card-plain', props: { variant: 'plain' } },
      ],
    },
  },
  {
    id: 'card.bare',
    component: 'Card',
    scene: 'collections',
    label: 'bare',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'collections-card-bare', props: { bare: true } }],
    },
  },
  {
    id: 'card.fill',
    component: 'Card',
    scene: 'collections',
    label: 'fill',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'collections-card-fill', props: { fill: true } }],
    },
  },
  {
    id: 'cell.static',
    component: 'Cell',
    scene: 'collections',
    label: 'static',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'collections-cell-static', props: {} }],
    },
  },
  {
    id: 'cell.action',
    component: 'Cell',
    scene: 'collections',
    label: 'action',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'collections-cell-action',
          props: {},
          presentProps: ['onPress'],
        },
      ],
    },
  },
  {
    id: 'cell.control',
    component: 'Cell',
    scene: 'collections',
    label: 'control',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'collections-cell-control',
          props: {},
          presentProps: ['extra'],
        },
      ],
    },
  },
  {
    id: 'cell.arrow',
    component: 'Cell',
    scene: 'collections',
    label: 'arrow',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'collections-cell-action', props: { arrow: true } },
      ],
    },
  },
  {
    id: 'cell.danger',
    component: 'Cell',
    scene: 'collections',
    label: 'danger',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'collections-cell-danger', props: { danger: true } },
      ],
    },
  },
  {
    id: 'cell.disabled',
    component: 'Cell',
    scene: 'collections',
    label: 'disabled',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'collections-cell-disabled', props: { disabled: true } },
      ],
    },
  },
  {
    id: 'list.grouped',
    component: 'List',
    scene: 'collections',
    label: 'grouped',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'collections-list-grouped', props: {} }],
    },
  },
  {
    id: 'list.flush',
    component: 'List',
    scene: 'collections',
    label: 'flush',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'collections-list-full', props: { flush: true } }],
    },
  },
  {
    id: 'list.divider-full',
    component: 'List',
    scene: 'collections',
    label: 'full divider',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'collections-list-full', props: { divider: 'full' } },
      ],
    },
  },
  {
    id: 'list.divider-none',
    component: 'List',
    scene: 'collections',
    label: 'no divider',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'collections-list-none', props: { divider: 'none' } },
      ],
    },
  },
  {
    id: 'grid.static',
    component: 'Grid',
    scene: 'collections',
    label: 'static',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'collections-grid-2', props: {} }],
    },
  },
  {
    id: 'grid.action',
    component: 'Grid',
    scene: 'collections',
    label: 'clickable',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'collections-grid-4',
          props: {},
          presentProps: ['onPress'],
        },
      ],
    },
  },
  {
    id: 'grid.columns',
    component: 'Grid',
    scene: 'collections',
    label: '列数',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'collections-grid-2', props: { columns: 2 } },
        { testID: 'collections-grid-4', props: { columns: 4 } },
        { testID: 'collections-grid-6', props: { columns: 6 } },
      ],
    },
  },
  {
    id: 'grid.card',
    component: 'Grid',
    scene: 'collections',
    label: 'card',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'collections-grid-2', props: { card: true } },
        { testID: 'collections-grid-6', props: { card: false } },
      ],
    },
  },
  {
    id: 'grid.badge',
    component: 'Grid',
    scene: 'collections',
    label: 'badge',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'collections-grid-4',
          props: {},
          presentProps: ['items'],
        },
      ],
    },
  },
  {
    id: 'entry-card.static',
    component: 'EntryCard',
    scene: 'collections',
    label: 'static',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'collections-entry-static', props: {} }],
    },
  },
  {
    id: 'entry-card.action',
    component: 'EntryCard',
    scene: 'collections',
    label: 'clickable',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'collections-entry-action',
          props: {},
          presentProps: ['onPress'],
        },
      ],
    },
  },
  {
    id: 'entry-card.with-subtitle',
    component: 'EntryCard',
    scene: 'collections',
    label: '有副标题',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'collections-entry-static', props: { sub: '带副标题' } },
      ],
    },
  },
  {
    id: 'entry-card.without-subtitle',
    component: 'EntryCard',
    scene: 'collections',
    label: '无副标题',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'collections-entry-action', props: {} }],
    },
  },
  {
    id: 'carousel.single',
    component: 'Carousel',
    scene: 'collections',
    label: '单页',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'collections-carousel-one',
          props: {},
          presentProps: ['data'],
        },
      ],
    },
  },
  {
    id: 'carousel.multiple',
    component: 'Carousel',
    scene: 'collections',
    label: '多页',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'collections-carousel-display',
          props: {},
          presentProps: ['data'],
        },
      ],
    },
  },
  {
    id: 'carousel.action',
    component: 'Carousel',
    scene: 'collections',
    label: '可操作项',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'collections-carousel-action',
          props: {},
          presentProps: ['onPressItem', 'getAccessibilityLabel'],
        },
      ],
    },
  },
  {
    id: 'carousel.indicator',
    component: 'Carousel',
    scene: 'collections',
    label: '指示器',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'collections-carousel-one',
          props: { indicatorPosition: 'bottom' },
        },
        {
          testID: 'collections-carousel-action',
          props: { indicatorPosition: 'overlay-bottom-right' },
        },
      ],
    },
  },
  {
    id: 'carousel.autoplay',
    component: 'Carousel',
    scene: 'collections',
    label: '自动播放',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'collections-carousel-action',
          props: {},
          presentProps: ['autoplay'],
        },
      ],
    },
  },
  {
    id: 'carousel.loop',
    component: 'Carousel',
    scene: 'collections',
    label: '循环',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'collections-carousel-action',
          props: {},
          presentProps: ['loop'],
        },
      ],
    },
  },
  {
    id: 'carousel.ref',
    component: 'Carousel',
    scene: 'collections',
    label: 'ref 控制',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'collections-carousel-action',
          props: {},
          presentProps: ['ref'],
        },
      ],
    },
  },
  {
    id: 'avatar.variants',
    component: 'Avatar',
    scene: 'media',
    label: 'brand/info/soft/neutral',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'media-avatar-variant-brand', props: { variant: 'brand' } },
        { testID: 'media-avatar-variant-info', props: { variant: 'info' } },
        { testID: 'media-avatar-variant-soft', props: { variant: 'soft' } },
        {
          testID: 'media-avatar-variant-neutral',
          props: { variant: 'neutral' },
        },
      ],
    },
  },
  {
    id: 'avatar.sizes',
    component: 'Avatar',
    scene: 'media',
    label: 'xs/sm/md/lg/xl',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'media-avatar-size-xs', props: { size: 'xs' } },
        { testID: 'media-avatar-size-sm', props: { size: 'sm' } },
        { testID: 'media-avatar-size-md', props: { size: 'md' } },
        { testID: 'media-avatar-size-lg', props: { size: 'lg' } },
        { testID: 'media-avatar-size-xl', props: { size: 'xl' } },
      ],
    },
  },
  {
    id: 'avatar.shapes',
    component: 'Avatar',
    scene: 'media',
    label: 'circle/square',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'media-avatar-shape-circle',
          props: { shape: 'circle' },
        },
        {
          testID: 'media-avatar-shape-square',
          props: { shape: 'square' },
        },
      ],
    },
  },
  {
    id: 'avatar.image',
    component: 'Avatar',
    scene: 'media',
    label: '图片',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'media-avatar-local',
          props: {},
          presentProps: ['source'],
        },
        {
          testID: 'media-avatar-remote',
          props: {},
          presentProps: ['source'],
        },
      ],
    },
  },
  {
    id: 'avatar.initial-fallback',
    component: 'Avatar',
    scene: 'media',
    label: '回退文字',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'media-avatar-failure',
          props: { label: '失效头像' },
          presentProps: ['source'],
        },
      ],
    },
  },
  {
    id: 'avatar-group.shapes',
    component: 'AvatarGroup',
    scene: 'media',
    label: 'circle/square',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'media-avatar-group-circle',
          props: { shape: 'circle' },
        },
        {
          testID: 'media-avatar-group-square',
          props: { shape: 'square' },
        },
      ],
    },
  },
  {
    id: 'avatar-group.overflow',
    component: 'AvatarGroup',
    scene: 'media',
    label: '未溢出/溢出',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'media-avatar-group-circle',
          props: { max: 5 },
        },
        {
          testID: 'media-avatar-group-square',
          props: { max: 5 },
        },
      ],
    },
  },
  {
    id: 'avatar-group.action',
    component: 'AvatarGroup',
    scene: 'media',
    label: '静态/可点击',
    witness: {
      kind: 'interaction',
      targetComponent: 'AvatarGroup',
      testID: 'media-avatar-group-square',
      handler: 'onOverflowPress',
      calls: [],
    },
  },
  {
    id: 'thumbnail.sizes',
    component: 'Thumbnail',
    scene: 'media',
    label: 'sm/md/lg',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'media-thumbnail-uri-sm', props: { size: 'sm' } },
        { testID: 'media-thumbnail-source-md', props: { size: 'md' } },
        { testID: 'media-thumbnail-source-lg', props: { size: 'lg' } },
      ],
    },
  },
  {
    id: 'thumbnail.sources',
    component: 'Thumbnail',
    scene: 'media',
    label: 'uri/source',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'media-thumbnail-uri-sm',
          props: {},
          presentProps: ['uri'],
        },
        {
          testID: 'media-thumbnail-source-md',
          props: {},
          presentProps: ['source'],
        },
      ],
    },
  },
  {
    id: 'thumbnail.selected',
    component: 'Thumbnail',
    scene: 'media',
    label: '选中',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'media-thumbnail-source-md', props: { selected: true } },
      ],
    },
  },
  {
    id: 'thumbnail.a11y-name',
    component: 'Thumbnail',
    scene: 'media',
    label: '无障碍名称',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'media-thumbnail-uri-sm',
          props: { accessibilityLabel: '远程缩略图' },
        },
        { testID: 'media-thumbnail-source-lg', props: {} },
      ],
    },
  },
  {
    id: 'thumbnail.load-error',
    component: 'Thumbnail',
    scene: 'media',
    label: '加载失败',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'media-thumbnail-failure',
          props: {},
          presentProps: ['uri'],
        },
      ],
    },
  },
  {
    id: 'logo.source',
    component: 'Logo',
    scene: 'media',
    label: 'source',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'media-logo-named',
          props: {},
          presentProps: ['source'],
        },
      ],
    },
  },
  {
    id: 'logo.sizes',
    component: 'Logo',
    scene: 'media',
    label: '尺寸',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'media-logo-named', props: { size: 72 } },
        { testID: 'media-logo-decorative', props: { size: 48 } },
      ],
    },
  },
  {
    id: 'logo.border-radius',
    component: 'Logo',
    scene: 'media',
    label: '圆角',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'media-logo-named', props: { borderRadius: 18 } }],
    },
  },
  {
    id: 'logo.a11y-mode',
    component: 'Logo',
    scene: 'media',
    label: '装饰/有意义图片',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'media-logo-named',
          props: { accessibilityLabel: 'Unif 示例标志' },
        },
        { testID: 'media-logo-decorative', props: {} },
      ],
    },
  },
  {
    id: 'gradient-wash.color-opacity',
    component: 'GradientWash',
    scene: 'business',
    label: '单色透明度',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          props: { fromOpacity: 0.2, toOpacity: 0 },
          presentProps: ['color'],
        },
      ],
    },
  },
  {
    id: 'gradient-wash.custom-stops',
    component: 'GradientWash',
    scene: 'business',
    label: '自定义 stops',
    witness: {
      kind: 'jsx-props',
      specimens: [{ props: {}, presentProps: ['stops'] }],
    },
  },
  {
    id: 'gradient-wash.height',
    component: 'GradientWash',
    scene: 'business',
    label: '高度',
    witness: {
      kind: 'jsx-props',
      specimens: [{ props: { height: 120, fromOpacity: 0.2 } }],
    },
  },
  {
    id: 'gradient-wash.gradient-id',
    component: 'GradientWash',
    scene: 'business',
    label: 'gradient id',
    witness: { kind: 'runtime-api', calls: ['useSvgId'] },
  },
  {
    id: 'radial-halo.circle',
    component: 'RadialHalo',
    scene: 'business',
    label: '圆形',
    witness: {
      kind: 'jsx-props',
      specimens: [{ props: { size: 120, maxOpacity: 0.22 } }],
    },
  },
  {
    id: 'radial-halo.ellipse',
    component: 'RadialHalo',
    scene: 'business',
    label: '椭圆',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { props: { size: 180, height: 96 }, presentProps: ['stops'] },
      ],
    },
  },
  {
    id: 'radial-halo.max-opacity',
    component: 'RadialHalo',
    scene: 'business',
    label: 'maxOpacity',
    witness: {
      kind: 'jsx-props',
      specimens: [{ props: { maxOpacity: 0.22 } }],
    },
  },
  {
    id: 'radial-halo.custom-stops',
    component: 'RadialHalo',
    scene: 'business',
    label: '自定义 stops',
    witness: {
      kind: 'jsx-props',
      specimens: [{ props: {}, presentProps: ['stops'] }],
    },
  },
  {
    id: 'radial-halo.gradient-id',
    component: 'RadialHalo',
    scene: 'business',
    label: 'gradient id',
    witness: { kind: 'runtime-api', calls: ['useSvgId'] },
  },
  {
    id: 'screen-backdrop.preset',
    component: 'ScreenBackdrop',
    scene: 'business',
    label: '预设',
    witness: {
      kind: 'jsx-props',
      specimens: [{ props: { preset: 'warmOrange' } }],
    },
  },
  {
    id: 'screen-backdrop.custom-halo',
    component: 'ScreenBackdrop',
    scene: 'business',
    label: '自定义 halo',
    witness: {
      kind: 'jsx-props',
      specimens: [{ props: {}, presentProps: ['stops', 'halos'] }],
    },
  },
  {
    id: 'screen-backdrop.theme',
    component: 'ScreenBackdrop',
    scene: 'business',
    label: '亮暗主题',
    witness: {
      kind: 'jsx-props',
      specimens: [{ props: {}, presentProps: ['stops'] }],
    },
  },
  {
    id: 'glass-stats.columns-2',
    component: 'GlassStats',
    scene: 'business',
    label: '2 列',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'business-stats-2', props: {}, presentProps: ['items'] },
      ],
    },
  },
  {
    id: 'glass-stats.columns-3',
    component: 'GlassStats',
    scene: 'business',
    label: '3 列',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'business-stats-3', props: {}, presentProps: ['items'] },
      ],
    },
  },
  {
    id: 'glass-stats.columns-4',
    component: 'GlassStats',
    scene: 'business',
    label: '4 列',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'business-stats-4', props: {}, presentProps: ['items'] },
      ],
    },
  },
  {
    id: 'glass-stats.formatted-value',
    component: 'GlassStats',
    scene: 'business',
    label: '已格式化值',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'business-stats-3', props: {}, presentProps: ['items'] },
      ],
    },
  },
  {
    id: 'avatar-with-ring.characters',
    component: 'AvatarWithRing',
    scene: 'business',
    label: '字符',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'business-avatar-48', props: { label: '小' } },
        { testID: 'business-avatar-64', props: { label: '中' } },
        { testID: 'business-avatar-88', props: { label: '大' } },
      ],
    },
  },
  {
    id: 'avatar-with-ring.sizes',
    component: 'AvatarWithRing',
    scene: 'business',
    label: '尺寸',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'business-avatar-48', props: { size: 48 } },
        { testID: 'business-avatar-64', props: { size: 64 } },
        { testID: 'business-avatar-88', props: { size: 88 } },
      ],
    },
  },
  {
    id: 'avatar-with-ring.ring-color',
    component: 'AvatarWithRing',
    scene: 'business',
    label: 'ring 颜色',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'business-avatar-48',
          props: {},
          presentProps: ['ringColor'],
        },
        {
          testID: 'business-avatar-64',
          props: {},
          presentProps: ['ringColor'],
        },
        {
          testID: 'business-avatar-88',
          props: {},
          presentProps: ['ringColor'],
        },
      ],
    },
  },
  {
    id: 'version-pill.status',
    component: 'VersionPill',
    scene: 'business',
    label: '状态',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'business-version-configured',
          props: {},
          presentProps: ['status'],
        },
      ],
    },
  },
  {
    id: 'version-pill.version-text',
    component: 'VersionPill',
    scene: 'business',
    label: '版本文案',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'business-version-configured',
          props: { version: '0.20.0', build: '20260803' },
        },
      ],
    },
  },
  {
    id: 'nav-bar.title',
    component: 'NavBar',
    scene: 'navigation',
    label: '标题',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-navbar-default',
          props: { title: '默认导航' },
        },
      ],
    },
  },
  {
    id: 'nav-bar.back',
    component: 'NavBar',
    scene: 'navigation',
    label: '返回',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-navbar-default',
          props: {},
          presentProps: ['left'],
        },
      ],
    },
  },
  {
    id: 'nav-bar.actions',
    component: 'NavBar',
    scene: 'navigation',
    label: '左右操作',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-navbar-default',
          props: {},
          presentProps: ['left', 'right'],
        },
      ],
    },
  },
  {
    id: 'nav-bar.safe-area',
    component: 'NavBar',
    scene: 'navigation',
    label: '安全区',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-navbar-default',
          props: { variant: 'default' },
        },
      ],
    },
  },
  {
    id: 'nav-bar.default',
    component: 'NavBar',
    scene: 'navigation',
    label: 'default',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-navbar-default',
          props: { variant: 'default' },
        },
      ],
    },
  },
  {
    id: 'nav-bar.brand',
    component: 'NavBar',
    scene: 'navigation',
    label: 'brand',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-navbar-brand',
          props: { variant: 'brand' },
        },
      ],
    },
  },
  {
    id: 'nav-bar.transparent',
    component: 'NavBar',
    scene: 'navigation',
    label: 'transparent',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-navbar-transparent',
          props: { variant: 'transparent' },
        },
      ],
    },
  },
  {
    id: 'drawer-header.name',
    component: 'DrawerHeader',
    scene: 'navigation',
    label: '用户名',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-drawer-header',
          props: { name: '王小明' },
        },
      ],
    },
  },
  {
    id: 'drawer-header.subtitle',
    component: 'DrawerHeader',
    scene: 'navigation',
    label: '副标题',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-drawer-header',
          props: { subtitle: '华东区 · 管理员' },
        },
      ],
    },
  },
  {
    id: 'drawer-header.avatar-source',
    component: 'DrawerHeader',
    scene: 'navigation',
    label: '头像 source',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-drawer-header-source',
          props: {},
          presentProps: ['source'],
        },
      ],
    },
  },
  {
    id: 'drawer-header.initial-fallback',
    component: 'DrawerHeader',
    scene: 'navigation',
    label: '首字回退',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-drawer-header',
          props: { name: '王小明' },
        },
      ],
    },
  },
  {
    id: 'tabs.selected',
    component: 'Tabs',
    scene: 'navigation',
    label: '选中项',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-tabs',
          props: {},
          presentProps: ['value'],
        },
      ],
    },
  },
  {
    id: 'tabs.change',
    component: 'Tabs',
    scene: 'navigation',
    label: '切换',
    witness: {
      kind: 'interaction',
      targetComponent: 'Tabs',
      testID: 'navigation-tabs',
      handler: 'onChange',
      calls: [],
    },
  },
  {
    id: 'tabs.item-disabled',
    component: 'Tabs',
    scene: 'navigation',
    label: '禁用项',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-tabs',
          props: {},
          presentProps: ['items'],
        },
      ],
    },
  },
  {
    id: 'tabs.all-disabled',
    component: 'Tabs',
    scene: 'navigation',
    label: '整体禁用',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-tabs-global-disabled',
          props: { disabled: true },
        },
      ],
    },
  },
  {
    id: 'segmented.selected',
    component: 'Segmented',
    scene: 'navigation',
    label: '选中项',
    witness: {
      kind: 'interaction',
      targetComponent: 'Segmented',
      testID: 'navigation-segmented-md',
      handler: 'onChange',
      calls: [],
    },
  },
  {
    id: 'segmented.sizes',
    component: 'Segmented',
    scene: 'navigation',
    label: '尺寸',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-segmented-md',
          props: { size: 'md' },
        },
        {
          testID: 'navigation-segmented-sm',
          props: { size: 'sm' },
        },
      ],
    },
  },
  {
    id: 'segmented.disabled',
    component: 'Segmented',
    scene: 'navigation',
    label: '禁用',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-segmented-disabled',
          props: { disabled: true },
        },
      ],
    },
  },
  {
    id: 'tab-bar.selected',
    component: 'TabBar',
    scene: 'navigation',
    label: '选中项',
    witness: {
      kind: 'interaction',
      targetComponent: 'TabBar',
      testID: 'navigation-tabbar',
      handler: 'onChange',
      calls: [],
    },
  },
  {
    id: 'tab-bar.numeric-badge',
    component: 'TabBar',
    scene: 'navigation',
    label: '数字徽标',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-tabbar',
          props: {},
          presentProps: ['items'],
        },
      ],
    },
  },
  {
    id: 'tab-bar.overflow-badge',
    component: 'TabBar',
    scene: 'navigation',
    label: '99+ 徽标',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-tabbar',
          props: {},
          presentProps: ['items'],
        },
      ],
    },
  },
  {
    id: 'tab-bar.a11y',
    component: 'TabBar',
    scene: 'navigation',
    label: '无障碍语义',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'navigation-tabbar',
          props: {},
          presentProps: ['items'],
        },
      ],
    },
  },
  {
    id: 'empty.title',
    component: 'Empty',
    scene: 'feedback',
    label: '标题',
    witness: {
      kind: 'jsx-props',
      specimens: [{ props: { title: '暂无反馈记录' } }],
    },
  },
  {
    id: 'empty.description',
    component: 'Empty',
    scene: 'feedback',
    label: '描述',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          props: {
            desc: '触发下方动作后可在结果面板查看安全摘要。',
          },
        },
      ],
    },
  },
  {
    id: 'empty.custom-icon',
    component: 'Empty',
    scene: 'feedback',
    label: '自定义图标',
    witness: {
      kind: 'jsx-props',
      specimens: [{ props: { icon: 'clipboard' } }],
    },
  },
  {
    id: 'empty.data-boundary',
    component: 'Empty',
    scene: 'feedback',
    label: '调用方空数据边界',
    witness: {
      kind: 'jsx-props',
      targetComponent: 'Empty',
      specimens: [
        {
          testID: 'feedback-empty-data-boundary',
          props: { title: '暂无反馈记录' },
          presentProps: ['desc', 'icon'],
        },
      ],
    },
  },
  {
    id: 'skeleton.line',
    component: 'Skeleton',
    scene: 'feedback',
    label: 'line',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'feedback-skeleton-line', props: { shape: 'line' } },
      ],
    },
  },
  {
    id: 'skeleton.rect',
    component: 'Skeleton',
    scene: 'feedback',
    label: 'rect',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-skeleton-rect',
          props: { shape: 'rect', height: 72 },
        },
      ],
    },
  },
  {
    id: 'skeleton.circle',
    component: 'Skeleton',
    scene: 'feedback',
    label: 'circle',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-skeleton-circle',
          props: { shape: 'circle', size: 40 },
        },
      ],
    },
  },
  {
    id: 'circular-progress.determinate',
    component: 'CircularProgress',
    scene: 'feedback',
    label: '确定进度',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-circular-progress-ring',
          props: { value: 0.42 },
        },
      ],
    },
  },
  {
    id: 'circular-progress.label',
    component: 'CircularProgress',
    scene: 'feedback',
    label: '中央百分比',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-circular-progress-label',
          props: { value: 0.68, showLabel: true },
        },
      ],
    },
  },
  {
    id: 'circular-progress.a11y-value',
    component: 'CircularProgress',
    scene: 'feedback',
    label: '无障碍值',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-circular-progress-ring',
          props: { accessibilityLabel: '文件上传进度' },
        },
      ],
    },
  },
  {
    id: 'spinner.sizes',
    component: 'Spinner',
    scene: 'feedback',
    label: '尺寸',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'feedback-spinner', props: { size: 24 } }],
    },
  },
  {
    id: 'spinner.color',
    component: 'Spinner',
    scene: 'feedback',
    label: '颜色',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-spinner',
          props: {},
          presentProps: ['color'],
        },
      ],
    },
  },
  {
    id: 'spinner.stroke-width',
    component: 'Spinner',
    scene: 'feedback',
    label: '描边宽度',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'feedback-spinner', props: { thickness: 3 } }],
    },
  },
  {
    id: 'border-beam.default',
    component: 'BorderBeam',
    scene: 'feedback',
    label: '默认',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'feedback-border-beam-default', props: {} }],
    },
  },
  {
    id: 'border-beam.inactive',
    component: 'BorderBeam',
    scene: 'feedback',
    label: '停用',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-border-beam-inactive',
          props: { active: false },
        },
      ],
    },
  },
  {
    id: 'border-beam.color',
    component: 'BorderBeam',
    scene: 'feedback',
    label: '颜色',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-border-beam-custom',
          props: {},
          presentProps: ['color'],
        },
      ],
    },
  },
  {
    id: 'border-beam.duration',
    component: 'BorderBeam',
    scene: 'feedback',
    label: '时长',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-border-beam-custom',
          props: { duration: 1800 },
        },
      ],
    },
  },
  {
    id: 'border-beam.line-width',
    component: 'BorderBeam',
    scene: 'feedback',
    label: '线宽',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-border-beam-custom',
          props: { lineWidth: 3 },
        },
      ],
    },
  },
  {
    id: 'border-beam.size',
    component: 'BorderBeam',
    scene: 'feedback',
    label: '流光长度',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-border-beam-custom',
          props: { size: 56 },
        },
      ],
    },
  },
  {
    id: 'border-beam.radius',
    component: 'BorderBeam',
    scene: 'feedback',
    label: '圆角',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-border-beam-custom',
          props: {},
          presentProps: ['borderRadius'],
        },
      ],
    },
  },
  {
    id: 'border-beam.reduced-motion',
    component: 'BorderBeam',
    scene: 'feedback',
    label: '减少动态效果',
    witness: {
      kind: 'runtime-api',
      calls: ['usePrefersReducedMotion'],
    },
  },
  {
    id: 'pulse.default',
    component: 'Pulse',
    scene: 'feedback',
    label: '默认',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'feedback-pulse-default', props: {} }],
    },
  },
  {
    id: 'pulse.opacity-range',
    component: 'Pulse',
    scene: 'feedback',
    label: '透明度区间',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-pulse',
          props: { from: 0.45, to: 1 },
        },
      ],
    },
  },
  {
    id: 'pulse.duration',
    component: 'Pulse',
    scene: 'feedback',
    label: '时长',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'feedback-pulse', props: { duration: 700 } }],
    },
  },
  {
    id: 'pulse.delay',
    component: 'Pulse',
    scene: 'feedback',
    label: '延迟',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'feedback-pulse', props: { delay: 0 } }],
    },
  },
  {
    id: 'pulse.reduced-motion',
    component: 'Pulse',
    scene: 'feedback',
    label: '减少动态效果',
    witness: {
      kind: 'runtime-api',
      calls: ['usePrefersReducedMotion'],
    },
  },
  {
    id: 'pulse-dot.default',
    component: 'PulseDot',
    scene: 'feedback',
    label: '默认',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'feedback-pulse-dot-default', props: {} }],
    },
  },
  {
    id: 'pulse-dot.sizes',
    component: 'PulseDot',
    scene: 'feedback',
    label: '尺寸',
    witness: {
      kind: 'jsx-props',
      specimens: [
        { testID: 'feedback-pulse-dot-size-color', props: { size: 12 } },
      ],
    },
  },
  {
    id: 'pulse-dot.color',
    component: 'PulseDot',
    scene: 'feedback',
    label: '颜色',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-pulse-dot-size-color',
          props: {},
          presentProps: ['color'],
        },
      ],
    },
  },
  {
    id: 'pulse-dot.custom-timing',
    component: 'PulseDot',
    scene: 'feedback',
    label: '自定义节奏',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-pulse-dot',
          props: { from: 0.5, to: 1, duration: 500 },
        },
      ],
    },
  },
  {
    id: 'pulse-dot.reduced-motion',
    component: 'PulseDot',
    scene: 'feedback',
    label: '减少动态效果',
    witness: {
      kind: 'runtime-api',
      calls: ['usePrefersReducedMotion'],
    },
  },
  {
    id: 'reveal.enter',
    component: 'Reveal',
    scene: 'feedback',
    label: '入场',
    witness: {
      kind: 'jsx-props',
      specimens: [{ testID: 'feedback-reveal', props: {} }],
    },
  },
  {
    id: 'reveal.duration',
    component: 'Reveal',
    scene: 'feedback',
    label: '时长',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-reveal',
          props: {},
          presentProps: ['duration'],
        },
      ],
    },
  },
  {
    id: 'reveal.container-style',
    component: 'Reveal',
    scene: 'feedback',
    label: '容器样式',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-reveal',
          props: {},
          presentProps: ['style'],
        },
      ],
    },
  },
  {
    id: 'reveal.reduced-motion',
    component: 'Reveal',
    scene: 'feedback',
    label: '减少动态效果',
    witness: {
      kind: 'runtime-api',
      calls: ['usePrefersReducedMotion'],
    },
  },
  {
    id: 'blur-layer.soft',
    component: 'BlurLayer',
    scene: 'feedback',
    label: 'soft',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-blur-layer',
          props: {},
          presentProps: ['intensity'],
        },
      ],
    },
  },
  {
    id: 'blur-layer.strong',
    component: 'BlurLayer',
    scene: 'feedback',
    label: 'strong',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-blur-layer',
          props: {},
          presentProps: ['intensity'],
        },
      ],
    },
  },
  {
    id: 'blur-layer.custom-tint',
    component: 'BlurLayer',
    scene: 'feedback',
    label: '自定义 tint',
    witness: {
      kind: 'jsx-props',
      specimens: [
        {
          testID: 'feedback-blur-layer',
          props: {},
          presentProps: ['tint'],
        },
      ],
    },
  },
  {
    id: 'blur-layer.theme',
    component: 'BlurLayer',
    scene: 'feedback',
    label: '亮暗主题',
    witness: {
      kind: 'runtime-api',
      calls: ['useColors'],
    },
  },
  {
    id: 'confirm-host.confirm',
    component: 'ConfirmHost',
    scene: 'feedback',
    label: '确认',
    witness: {
      kind: 'runtime-api',
      calls: ['confirm'],
      rootHost: 'ConfirmHost',
    },
  },
  {
    id: 'confirm-host.cancel',
    component: 'ConfirmHost',
    scene: 'feedback',
    label: '取消',
    witness: {
      kind: 'runtime-api',
      calls: ['confirm'],
      rootHost: 'ConfirmHost',
    },
  },
  {
    id: 'confirm-host.destructive',
    component: 'ConfirmHost',
    scene: 'feedback',
    label: '危险操作',
    witness: {
      kind: 'runtime-api',
      calls: ['confirm'],
      rootHost: 'ConfirmHost',
    },
  },
  {
    id: 'confirm-host.reentrant',
    component: 'ConfirmHost',
    scene: 'feedback',
    label: '重入',
    witness: {
      kind: 'interaction',
      targetComponent: 'Button',
      testID: 'feedback-confirm-reentrant',
      handler: 'onPress',
      calls: ['confirm'],
      rootHost: 'ConfirmHost',
    },
  },
  {
    id: 'toast-host.kinds',
    component: 'ToastHost',
    scene: 'feedback',
    label: '类型',
    witness: {
      kind: 'runtime-api',
      calls: ['toast.info', 'toast.success', 'toast.error'],
      rootHost: 'ToastHost',
    },
  },
  {
    id: 'toast-host.positions',
    component: 'ToastHost',
    scene: 'feedback',
    label: '位置',
    witness: {
      kind: 'runtime-api',
      calls: ['toast.info'],
      rootHost: 'ToastHost',
    },
  },
  {
    id: 'toast-host.duration',
    component: 'ToastHost',
    scene: 'feedback',
    label: '持续时间',
    witness: {
      kind: 'runtime-api',
      calls: ['toast.info'],
      rootHost: 'ToastHost',
    },
  },
  {
    id: 'toast-host.latest-wins',
    component: 'ToastHost',
    scene: 'feedback',
    label: 'latest wins',
    witness: {
      kind: 'runtime-api',
      calls: ['toast.info', 'toast.error'],
      rootHost: 'ToastHost',
    },
  },
] as const satisfies readonly ShowcaseStateContractEntry[];

export type ShowcaseStateId = (typeof showcaseStateContract)[number]['id'];
