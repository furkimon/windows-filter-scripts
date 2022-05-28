import Scene from 'Scene';
import Diagnostics from 'Diagnostics';
import Animation from 'Animation';
import Time from 'Time';
import Shaders from 'Shaders';
import Reactive from 'Reactive';
import CameraInfo from 'CameraInfo';
import FaceTracking from 'FaceTracking';
import Materials from 'Materials';

const face: Face = FaceTracking.face(0);
const faceTransform: TransformSignal = face.cameraTransform;

export default class Util {
  getVertexShader(): ShaderSignal {
  return Shaders.vertexAttribute({ 'variableName' : Shaders.VertexAttribute.TEX_COORDS }); // uvs
  }

  getFragmantShader(uvs: ShaderSignal): ShaderSignal {
    return Shaders.fragmentStage(uvs); // fuv
  }

  getResolution(): Vec2Signal {
    return Reactive.pack2(CameraInfo.previewSize.width, CameraInfo.previewSize.height)
  }

  getFacePosition(face: Face): PointSignal {
    return face.cameraTransform.position;
  }

  getDeviceScreenSize(): Vec2Signal {
    return Reactive.point2d(CameraInfo.previewSize.width, CameraInfo.previewSize.height);
  }

  getDeviceScreenRatio(): ScalarSignal {
    const { x, y } = this.getDeviceScreenSize();
    
    return Reactive.div(x, y);
  }

  getCameraSample(cameraTextureSignal: ShaderSignal): ShaderSignal {
    return Shaders.textureSampler(cameraTextureSignal, this.getFragmantShader(this.getVertexShader()));
  }

  getPersonMaterial() {
    return Materials.findFirst('person');
  }

  async getFocalDistance() {
    return Scene.root.findFirst('Focal Distance');
  }
 
  async delay({ ms }: { ms: number }) {
    return new Promise(resolve => Time.setTimeout(() => resolve, ms));
  }

  blendTextures({ src, dst }: { src: ShaderSignal; dst: ShaderSignal}): ShaderSignal {
    return Shaders.blend(src, dst, { mode: Shaders.BlendMode.NORMAL });
  }

  getLipPointsFromFace(face: Face) {
    return [
        face.mouth.upperLipCenter,
        face.mouth.lowerLipCenter,
        face.mouth.leftCorner,
        face.mouth.rightCorner
    ];
  }

  includeToFocalDistance ({
    focalDistance,
    objectArray,
  }: {
    focalDistance: FocalDistance;
    objectArray: SceneObject[];
  }) {
    objectArray.map((object: SceneObject) => {
      focalDistance.addChild(object);
      Diagnostics.log(`Included in to focal : ${object.name}`)
    });
  };
  
  createLoopCount(number: number) {
    const array = [];
  
    for (let i = 0; i < number; i++) {
      array.push(i);
    }
  
    return array;
  };
  
  getMouthOpenness(face: Face) {
    return face.mouth.openness;
  }

  isValueDirectionChanged(event) {
    return (event.oldValue > 0 && event.newValue < 0) || (event.oldValue < 0 && event.newValue > 0);
  };

  sortPlaneArrayByName(array: any[]) {
    return array.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }
}

    // const blendedTex = this.util.blendTextures({
    //   src: texture.signal,
    //   dst: cameraTexture.signal,
    // });



  // zoomWithScale({ tex, zoom }: { tex: TextureBase; zoom: number }) {
  //   const translation = this.getFacePosition(face);

  //   const scaledZoom = Reactive.mul(this.getDeviceScreenRatio(), zoom);

  //   const scale = Reactive.point(scaledZoom, zoom, 0);

  //   const transform = Reactive.transform(translation, scale, faceTransform.rotation);

  //   // const vec3Transform = Reactive.pack3(transform.x, transform.y, transform.z);

  //   const vT = Shaders.vertexTransform({ variableName: Shaders.BuiltinUniform.NORMAL_MATRIX });

  //   const sss = Shaders.composition(vT, transform);

  //   return Shaders.textureTransform(
  //     this.getCameraSample(tex.signal),
  //     sss,
  //   );
  // }