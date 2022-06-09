import Scene from 'Scene';
import Animation from 'Animation';
import Diagnostics from 'Diagnostics';
import Shaders from 'Shaders';
import Reactive from 'Reactive';

import { TFaceToPlanePosition, PUSH_PLANE_AMOUNT } from './constants';

import Util from './util'
import Factory from './factory';

export default class PlaneActions {
  private factory: Factory;
  private util: Util;
  private focalDistance: FocalDistance;

  constructor({ focalDistance }: { focalDistance?: FocalDistance }) {
    this.factory = new Factory({ focalDistance });
    this.util = new Util();
    this.focalDistance = focalDistance;
  }

  async createPlanesWithMaterials(number: number): Promise<Plane[]> {
    const counter = this.util.createLoopCount(number);

    const materials = await Promise.all([
      this.factory.findMaterial({ name: 'window1'}),
      this.factory.findMaterial({ name: 'window2'}),
      this.factory.findMaterial({ name: 'window3'}),
    ]);

    const planeArray = await Promise.all(
      counter.map(async (item) => {
        let plane = await this.factory.createPlaneInstance({ name: `plane${item}` });

        plane.material = materials[1];

        return plane as Plane;
      }),
    );

    return this.util.sortPlaneArrayByName(planeArray);
  };

  assignMaterialsToPlanes({ planeArray, materialArray }: { planeArray : Plane[], materialArray: MaterialBase[] }) {
    planeArray.map((plane: Plane, i: number) => {
      plane.material = materialArray[i];
    })
  }

  givePlaneFacePosition({ plane, faceTransform }: TFaceToPlanePosition) {
    // const { x, y } = this.util.getFacePosition();
    
    plane.x = faceTransform.position.x;
    plane.y = faceTransform.position.y;
  }

  givePlaneFacePositionMultiplied({ plane, faceTransform }: TFaceToPlanePosition) {
    // const { x, y } = this.util.getFacePosition(face);


    plane.x = Reactive.mul(faceTransform.position.x, 2)
    plane.y = Reactive.mul(faceTransform.position.y, 2);
  }
  
  givePlaneAheadOfFacePosition({ plane, faceTransform }: TFaceToPlanePosition) {
    faceTransform.x.monitor().subscribe((event) => {
      return plane.x = event.newValue > 0 ? faceTransform.position.x.add(PUSH_PLANE_AMOUNT) : faceTransform.position.x.add(-PUSH_PLANE_AMOUNT);
    });

    faceTransform.y.monitor().subscribe((event) => {
      return plane.y = event.newValue > 0 ? faceTransform.position.y.add(PUSH_PLANE_AMOUNT) : faceTransform.position.y.add(-PUSH_PLANE_AMOUNT);
    });
  }

  givePlaneAheadOfFacePositionTRIAL({ plane, faceTransform }: TFaceToPlanePosition) {
    faceTransform.x.monitor().subscribe((event) => {

      if (this.util.isValueDirectionChanged(event)) {
        Diagnostics.log(`X : ${event.newValue}`);

        // const animation = this.animationOp.createValueDirectionChangeAnimation(event);

        // return plane.x = animation;
      } else {
        return plane.x = event.newValue > 0 ? faceTransform.position.x.add(PUSH_PLANE_AMOUNT) : faceTransform.position.x.add(-PUSH_PLANE_AMOUNT);
      }
    });

    faceTransform.y.monitor().subscribe((event) => {
      
      if (this.util.isValueDirectionChanged(event)) {
        Diagnostics.log(`Y : ${event.newValue}`);

        // const animation = this.animationOp.createValueDirectionChangeAnimation(event);

        // return plane.y = animation
      } else {
        return plane.y = event.newValue > 0 ? faceTransform.position.y.add(PUSH_PLANE_AMOUNT) : faceTransform.position.y.add(-PUSH_PLANE_AMOUNT);
      }
    })
  }
  
  givePlaneArrayFacePosition({ planeArray, faceTransform }: { planeArray: Plane[]; faceTransform: TransformSignal }) {
    planeArray.map((plane: Plane, i) => {
      plane.x = faceTransform.position.x.add(-0.02).add(0.02 * i);
      plane.y = faceTransform.position.y.add(-0.02).add(0.02 * i);
    })
  }
  
  givePlaneFaceRotation({ plane, faceTransform }: TFaceToPlanePosition) {
    plane.transform.rotationX = faceTransform.rotationX;
    plane.transform.rotationY = faceTransform.rotationY;
    plane.transform.rotationZ = faceTransform.rotationZ;
  }
  
  movePlanesWithAnimation({ planeArray }: { planeArray: Plane[] }) {
    const tD = Animation.timeDriver({
      durationMilliseconds: 1000,
      loopCount: 2,
      mirror: true,
    });
  
    tD.start();
  
    planeArray.map((plane, i) => {
      const sample = Animation.samplers.easeOutQuart(0, -0.02 * i);
      const animation = Animation.animate(tD, sample);
      plane.x = animation;
      plane.y = animation;
    })
  }
  
  followPlanesByPlanes({ planeArray }: { planeArray: Plane[] }) {
    planeArray.map((plane: Plane, i) => {
      if (i === planeArray.length - 1) return;
  
      plane.x = planeArray[i + 1].x.expSmooth(600);
      plane.y = planeArray[i + 1].y.expSmooth(600);
    })
  }

  async createTalePlanes({ faceTransform, focalDistance }: { faceTransform: TransformSignal; focalDistance: FocalDistance }) {
    const [planeArray, planeGroup] = await Promise.all([
      this.createPlanesWithMaterials(5),
      this.factory.createNullInstance({ name: 'planeGroup' })
    ]);

    this.givePlaneFacePositionMultiplied({
      plane: planeArray[planeArray.length - 1],
      faceTransform,
    });

    this.followPlanesByPlanes({ planeArray: planeArray });
      
    focalDistance.addChild(planeGroup);
    
    planeArray.map((plane) => planeGroup.addChild(plane));
  }
}
