import { Effect } from 'postprocessing';
import { Uniform } from 'three';

const fragmentShader = /* glsl */ `
uniform float colorBits;
uniform float intensity;
uniform float grayscale;
uniform float scale;
uniform float noise;

uint Rand(uint x) {
    x ^= x >> 16;
    x *= 0x7feb352du;
    x ^= x >> 15;
    x *= 0x846ca68bu;
    x ^= x >> 16;
    return x;
}

uint HilbertIndex(uvec2 p) {
    uint i = 0u;
    for(uint l = 0x4000u; l > 0u; l >>= 1u) {
        uvec2 r = min(p & l, 1u);

        i = (i << 2u) | ((r.x * 3u) ^ r.y);
        p = r.y == 0u ? (0x7fffu * r.x) ^ p.yx : p;
    }
    return i;
}

uint ReverseBits(uint x) {
    x = ((x & 0xaaaaaaaau) >> 1) | ((x & 0x55555555u) << 1);
    x = ((x & 0xccccccccu) >> 2) | ((x & 0x33333333u) << 2);
    x = ((x & 0xf0f0f0f0u) >> 4) | ((x & 0x0f0f0f0fu) << 4);
    x = ((x & 0xff00ff00u) >> 8) | ((x & 0x00ff00ffu) << 8);
    return (x >> 16) | (x << 16);
}

uint OwenHash(uint x, uint seed) {
    x ^= x * 0x3d20adeau;
    x += seed;
    x *= (seed >> 16) | 1u;
    x ^= x * 0x05526c56u;
    x ^= x * 0x53a22864u;
    return x;
}

float ReshapeUniformToTriangle(float v) {
    v = v * 2.0 - 1.0;
    v = sign(v) * (1.0 - sqrt(max(0.0, 1.0 - abs(v))));
    return v + 0.5;
}

float getBlueNoise(vec2 position, float patternScale) {
    vec2 scaledPos = floor(position / patternScale);
    uint m = HilbertIndex(uvec2(scaledPos));
    m = OwenHash(ReverseBits(m), 0xe7843fbfu);
    m = OwenHash(ReverseBits(m), 0x8d8fb1e0u);
    float mask = float(ReverseBits(m)) / 4294967296.0;
    return ReshapeUniformToTriangle(mask);
}

float getLuminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 coord = gl_FragCoord.xy;
  vec3 color = inputColor.rgb;

  // Use blue noise for dithering
  float blueNoise = getBlueNoise(coord, scale);

  float levels = pow(2.0, colorBits);

  // Use blue noise with configurable intensity
  float threshold = blueNoise * noise - (noise * 0.5);

  if (grayscale > 0.5) {
    float lum = getLuminance(color);
    float quantized = floor(lum * levels + threshold) / levels;
    color = vec3(quantized);
  } else {
    vec3 quantized = floor(color * levels + threshold) / levels;
    color = quantized;
  }

  outputColor = vec4(mix(inputColor.rgb, color, intensity), inputColor.a);
}
`;

export class DitheringEffect extends Effect {
  constructor(options?: {
    colorBits?: number;
    intensity?: number;
    grayscale?: boolean;
    scale?: number;
    noise?: number;
  }) {
    super('DitheringEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['colorBits', new Uniform(options?.colorBits ?? 4)],
        ['intensity', new Uniform(options?.intensity ?? 1)],
        ['grayscale', new Uniform(options?.grayscale ? 1 : 0)],
        ['scale', new Uniform(options?.scale ?? 1)],
        ['noise', new Uniform(options?.noise ?? 1.2)],
      ]),
    });
  }

  get colorBits(): number {
    return this.uniforms.get('colorBits')!.value;
  }

  set colorBits(value: number) {
    this.uniforms.get('colorBits')!.value = value;
  }

  get intensity(): number {
    return this.uniforms.get('intensity')!.value;
  }

  set intensity(value: number) {
    this.uniforms.get('intensity')!.value = value;
  }

  get grayscale(): boolean {
    return this.uniforms.get('grayscale')!.value === 1;
  }

  set grayscale(value: boolean) {
    this.uniforms.get('grayscale')!.value = value ? 1 : 0;
  }

  get scale(): number {
    return this.uniforms.get('scale')!.value;
  }

  set scale(value: number) {
    this.uniforms.get('scale')!.value = value;
  }

  get noise(): number {
    return this.uniforms.get('noise')!.value;
  }

  set noise(value: number) {
    this.uniforms.get('noise')!.value = value;
  }
}
