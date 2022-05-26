export const PLANE = 'Plane';
export const NAME = 'name';
export const PUSH_PLANE_AMOUNT = 0.05;

export interface IPlaneAttrubutes {
  name: string;
	width?: number
	height?: number;
	hidden?: boolean;
}

export interface IMaterialAttributes {
  name: string;
  type?: string;
  blendMode?: 'ALPHA';
  opacity?: number;
  diffuse?: TextureBase;
  diffuseColorFactor?: ColorTexture;
}

export interface IRectangleAttributes {
  name: string;
  width?: number;
  height?: number;
  hidden?: boolean;
}

export enum ObjectTypes {
	CANVAS = 'Canvas',
  PLANE = 'Plane',
	PLANAR_IMAGE = 'PlanarImage', // Rectangle
	AMBIENT = 'AmbientLightSource',
	DIRECTIONAL = 'DirectionalLightSource',
	POINT = 'PointLightSource',
	PARTICLE = 'ParticleSystem',
	SCENE = 'SceneObject', // NullObject
}

export enum MaterialTypes {
  DEFAULT = 'DefaultMaterial',
  BLENDED = 'BlendedMaterial',
}

export type TFaceToPlanePosition = { plane: Plane; faceTransform: any };