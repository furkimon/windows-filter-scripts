import Scene from 'Scene';
import Materials from 'Materials';
import Textures from 'Textures';
import CameraInfo from 'CameraInfo';
import Shaders from 'Shaders';
import Reactive from 'Reactive';
import Diagnostics from 'Diagnostics';

import {
  ObjectTypes,
  IPlaneAttrubutes,
  IMaterialAttributes,
  MaterialTypes,
  IRectangleAttributes,
} from './constants';
import Util from './util';
import AnimationCenter from './animation';


export default class Factory {
  private util: Util;
  private anime: AnimationCenter;

  constructor() {
    this.util = new Util();
    this.anime = new AnimationCenter();
  }

  async findMaterial({ name }: { name: string }): Promise<MaterialBase> {
    return Materials.findFirst(name);
  }

  async findTexture({ name }: { name: string }): Promise<TextureBase> {
    return Textures.findFirst(name);
  }

  async createNullInstance({ name }: { name: string }) : Promise<SceneObject>{
    return Scene.create(ObjectTypes.SCENE, { name }) as unknown as SceneObject;
  }

  async createCanvas({ name }: { name: string }): Promise<Canvas> {
    return Scene.create(ObjectTypes.CANVAS, { name }) as unknown as Canvas;
  }

  async createRectangleInstance({ name, width, height, hidden = false }: IRectangleAttributes): Promise<PlanarImage> {
    const attributes: IRectangleAttributes = { name };

    if (width) attributes.width = width;
    if (height) attributes.height = height;
    if (hidden) attributes.hidden = hidden;

    return Scene.create(ObjectTypes.PLANAR_IMAGE, attributes) as unknown as PlanarImage;
  }

  async createPlaneInstance({ name, width, height, hidden }: IPlaneAttrubutes) : Promise<Plane>{
    const attributes: IPlaneAttrubutes = { name: name ? name : `${ObjectTypes.PLANE}${(Math.random() * 1000).toString()}` };

    if (width) attributes.width = width;
    if (height) attributes.height = height;
    if (hidden) attributes.hidden = hidden;

    return Scene.create(ObjectTypes.PLANE, attributes) as unknown as Plane;
  }

  async createPlanes(number: number): Promise<SceneObjectBase[]> {
    const counter = this.util.createLoopCount(number);
    
    return Promise.all(
      counter.map((el) => {
        return this.createPlaneInstance({ name: `plane${el}` });
      }),
    );
  };

  async createMaterialInstance<T>({
    name,
    type = MaterialTypes.DEFAULT,
    blendMode = 'ALPHA',
    diffuse,
    diffuseColorFactor,
    opacity,
  }: IMaterialAttributes) : Promise<MaterialBase>{
    const attributes: IMaterialAttributes = { name: name ? name : `${type}${(Math.random() * 1000).toString()}` };

    if (blendMode) attributes.blendMode = blendMode;
    if (diffuse) attributes.diffuse = diffuse;
    if (opacity) attributes.opacity = opacity;
    if (diffuseColorFactor) attributes.diffuseColorFactor = diffuseColorFactor;

    return Materials.create(type, attributes);
  }

  async createMaterials(number: number): Promise<MaterialBase[]> {
    const counter = this.util.createLoopCount(number);
    
    return Promise.all(
      counter.map((el) => {
        return this.createMaterialInstance({ name: `material${el}` });
      }),
    );
  }

  createShadesForTexturex({ tex }: { tex: TextureBase }) {
    return Shaders.blend(tex.signal, Reactive.pack4(1,0,0,1), { mode: Shaders.BlendMode.PLUSDARKER })
  }

  createShadesForTexture({ tex }: { tex: TextureBase }) {
   const val = this.anime.lightUpRedGreenAnimation();

    return Shaders.blend(tex.signal, val, { mode: Shaders.BlendMode.PLUSDARKER })
  }

  async createRedTintMaterial(): Promise<MaterialBase> {
    const [material, camTex] = await Promise.all([
      this.createMaterialInstance({ name: 'redCamTexMaterial' }),
      this.findTexture({ name: 'cameraTexture' }),
    ])
    
    const redCameraTexture = this.createShadesForTexture({ tex: camTex })
  
    material.setTextureSlot('DIFFUSE', redCameraTexture);
    
    return material;
  }

  async getCamera(): Promise<Camera> {
    return Scene.root.findFirst('Camera') as unknown as Camera
  }

  async createRectWithCanvas (): Promise<PlanarImage> {
    const [fD, camera, canv, rect] = await Promise.all([
      this.util.getFocalDistance(),
      this.getCamera(),
      this.createCanvas({ name: 'canv' }),
      this.createRectangleInstance({ name: 'rect' }),
    ]);

    canv.setMode(Scene.RenderMode.WORLD_SPACE)

    fD.addChild(canv);
    canv.addChild(rect);

    rect.width = camera.focalPlane.width;
    rect.height = camera.focalPlane.height;
    rect.horizontalAlignment = Scene.HorizontalAlignment.CENTER;
    rect.verticalAlignment = Scene.VerticalAlignment.CENTER;

    return rect;
  }

  async createRectWithCamTex ({ tex }: { tex: TextureBase }) {
    const [rect, matNew] = await Promise.all([
      this.createRectWithCanvas(),
      this.createMaterialInstance({ name: 'matNew' }),
      // this.createShadesForTexture({ tex }),
    ]);

    matNew.setTextureSlot(Shaders.DefaultMaterialTextures.DIFFUSE, tex.signal);

    rect.material = matNew;
  }

  async giveRectAnimation ({ tex, rect }: { tex: TextureBase; rect: PlanarImage }) {
    const [matNew, shadedTex] = await Promise.all([
      this.createMaterialInstance({ name: 'matNew' }),
      this.createShadesForTexture({ tex }),
    ]);

    matNew.setTextureSlot(Shaders.DefaultMaterialTextures.DIFFUSE, shadedTex);

    rect.material = matNew;
  }

  async createFaceMesh({ name }: { name: string }) {
    return Scene.create('FaceMesh', { name }) as unknown as FaceMesh;
  }

  async addMeshToParent({ meshesParent, newMesh }: { meshesParent: any; newMesh: FaceMesh }) {
    return meshesParent.addChild(newMesh);
  }

  assignTextureToMaterial({ texture, material }: { texture: TextureBase; material: MaterialBase }) {
    material.diffuse = texture;
  }

  addMaterialToObject({ object, material }: { object: any; material: MaterialBase }) {
    object.material = material;
  }

  async destroyObject(object: any) {
    await Scene.destroy(object);
  }

  async destroyMaterial(material: any) {
    await Materials.destroy(material);
  }
}

// canvas.mode = Scene.RenderMode.WORLD_SPACE;
// In WORLD_SPACE Canvas behaves as regular 3D object

// Materials.create("DefaultMaterial", {
//   "name": "Default Material",
//   "blendMode": "ALPHA",
//   "opacity": 1.0,
//   "diffuse": textureOne,
// }),

// Materials.create("BlendedMaterial", {
//   "name": "Blended Material",
//   "opacity": 0.8,
//   "diffuse": textureTwo,
// }),
// ]);
// dynamicPlane.material = defaultMaterial;

 // Destroy the plane and material when the plane is tapped
//  TouchGestures.onTap(dynamicPlane).subscribe(() => {
//   Scene.destroy(dynamicPlane);
//   Materials.destroy(dynamicMaterial);
// });

  // Clone the existing material from the Assets panel and alter its initiation state, including specifying a new diffuse texture.
//   Materials.clone(existingMaterial, {
//     "name": "Cloned Material",
//     "blendMode": "ALPHA",
//     "opacity": 0.8,
//     "diffuse": newTexture,
//     "diffuseColorFactor": Reactive.RGBA(255,0,0,1),
// }),


// focalDistance.addChild(dynamicCanvas);
// dynamicCanvas.addChild(dynamicRectangle);
// focalDistance.addChild(dynamicAmbientLight);
// focalDistance.addChild(dynamicDirectionalLight);
// focalDistance.addChild(dynamicPointLight);
// focalDistance.addChild(dynamicSpotLight);
// focalDistance.addChild(dynamicParticleSystem);
// focalDistance.addChild(dynamicNull);