import { TrashOutlined } from '@unif/react-native-icons';
import {
  IconButton,
  InlineConfirmScope,
  type IconButtonConfirmation,
} from '@unif/react-native-design';

const noop = () => {};
const confirmation: IconButtonConfirmation = {
  label: '确认删除',
  confirmationKey: 'record:version',
};
const props = {
  icon: TrashOutlined,
  accessibilityLabel: '删除记录',
  onPress: noop,
};
<InlineConfirmScope testID="confirmation-region">
  <IconButton {...props} />;
  <IconButton {...props} confirmation={confirmation} variant="glass" />
  <IconButton
    {...props}
    confirmation={{
      ...confirmation,
      confirming: true,
      onRequest: noop,
      onCancel: noop,
    }}
    surfaceSize={36}
    iconSize={21}
  />
</InlineConfirmScope>;
<IconButton
  {...props}
  // @ts-expect-error 受控确认必须提供请求和取消回调。
  confirmation={{ label: '确认删除', confirming: true }}
/>;
// @ts-expect-error 显式确认需要非空文案，未提供配置仍单击执行。
<IconButton {...props} confirmation={{}} />;
<IconButton
  {...props}
  // @ts-expect-error 目标令牌不接受业务记录对象。
  confirmation={{ label: '确认删除', confirmationKey: { id: 'record' } }}
/>;
