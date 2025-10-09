import { defineComponent, Types } from 'bitecs';

export const NetworkIdentity = defineComponent({
  networkId: Types.ui32,
});

export const ClientAuthority = defineComponent({});

export const ServerAuthority = defineComponent({});

export const RemoteSnapshot = defineComponent({
  sessionId: Types.ui32,
  localRenderTick: Types.f32,

  tick0: Types.ui32,
  posX0: Types.f32,
  posY0: Types.f32,
  posZ0: Types.f32,
  rotX0: Types.f32,
  rotY0: Types.f32,
  rotZ0: Types.f32,
  rotW0: Types.f32,

  tick1: Types.ui32,
  posX1: Types.f32,
  posY1: Types.f32,
  posZ1: Types.f32,
  rotX1: Types.f32,
  rotY1: Types.f32,
  rotZ1: Types.f32,
  rotW1: Types.f32,

  tick2: Types.ui32,
  posX2: Types.f32,
  posY2: Types.f32,
  posZ2: Types.f32,
  rotX2: Types.f32,
  rotY2: Types.f32,
  rotZ2: Types.f32,
  rotW2: Types.f32,
});
