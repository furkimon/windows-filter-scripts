import Diagnostics from 'Diagnostics';
import FaceTracking from 'FaceTracking';
import Patches from 'Patches';
import Materials from 'Materials';
import Textures from 'Textures';
import Shaders from 'Shaders';
import Scene from 'Scene';
import CameraInfo from 'CameraInfo';
import Reactive from 'Reactive';
import Time from 'Time';

import Util from './util'
import PlaneActions from './planeActions';
import Factory from './factory';

const util = new Util();
const factory = new Factory();
const planes = new PlaneActions();

const face: Face = FaceTracking.face(0);
const faceTransform: TransformSignal = face.cameraTransform;

(async () => {
  const focalDistance = await util.getFocalDistance();

  const planeArray = await planes.createPlanesWithMaterials(5) as Plane[];

  const camTex = await Textures.findFirst('cameraTexture');

  planes.givePlaneFacePositionMultiplied({
    plane: planeArray[planeArray.length - 1],
    faceTransform,
  });

  await factory.createRectWithCamTex({ tex: camTex });

  planes.followPlanesByPlanes({ planeArray: planeArray });

  const planeGroup = await factory.createNullInstance({ name: 'planeGroup' });
    
  focalDistance.addChild(planeGroup);
  
  planeArray.map((plane) => planeGroup.addChild(plane));
})();
