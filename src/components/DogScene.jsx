import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export default function DogScene({ stage, action, onPet }) {
  const host = useRef(null);
  const currentAction = useRef(action);
  const petCallback = useRef(onPet);
  const [unavailable, setUnavailable] = useState(false);
  currentAction.current = action;
  petCallback.current = onPet;

  useEffect(() => {
    const container = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setUnavailable(true);
      return;
    }
    setUnavailable(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    camera.position.set(3.5, 2.7, 6);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.1, 0);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI / 2.1;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8e9dce, 2.7));
    const light = new THREE.DirectionalLight(0xfff3dd, 4);
    light.position.set(3, 6, 4);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.left = -4;
    light.shadow.camera.right = 4;
    light.shadow.camera.top = 4;
    light.shadow.camera.bottom = -4;
    light.shadow.normalBias = 0.03;
    scene.add(light);
    const fill = new THREE.DirectionalLight(0xb9caff, 2);
    fill.position.set(-4, 3, -2);
    scene.add(fill);
    const material = (color, roughness = 0.8) =>
      new THREE.MeshStandardMaterial({ color, roughness });
    const adolescent = stage === 2;
    const fur = material(adolescent ? 0xd99b52 : 0xe9b778);
    const cream = material(0xffe7be);
    const earFur = material(0xa86b3b);
    const pink = material(0xe9a4a0);
    const black = material(0x25212b, 0.3);
    const white = material(0xffffff, 0.2);
    const blue = material(0x0f2bc7);
    const gold = material(0xd0b804, 0.35);
    const dog = new THREE.Group();
    dog.scale.setScalar([0.86, 0.97, 1.06][stage - 1]);
    scene.add(dog);
    function oval(parent, mat, position, scale) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), mat);
      mesh.position.set(...position);
      mesh.scale.set(...scale);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }
    const bodyHeight = [0.62, 0.76, 0.84][stage - 1];
    const body = oval(
      dog,
      fur,
      [0, bodyHeight + 0.1, -0.06],
      [adolescent ? 0.4 : 0.49, bodyHeight, adolescent ? 0.37 : 0.43],
    );
    oval(
      dog,
      cream,
      [0, bodyHeight + 0.08, 0.3],
      [adolescent ? 0.26 : 0.33, bodyHeight * 0.8, 0.19],
    );
    [-1, 1].forEach((side) => {
      oval(dog, fur, [side * 0.43, 0.3, -0.19], [0.3, 0.3, 0.34]);
      oval(dog, cream, [side * 0.3, 0.16, 0.44], [0.22, 0.16, 0.31]);
      oval(dog, fur, [side * 0.3, 0.43, 0.31], [0.16, 0.34, 0.18]);
      [-0.065, 0.065].forEach((offset) => {
        oval(
          dog,
          earFur,
          [side * 0.3 + offset, 0.15, 0.727],
          [0.012, 0.046, 0.012],
        );
      });
    });
    const head = new THREE.Group();
    const headY = bodyHeight * 1.7 + 0.51;
    head.position.set(0, headY, 0.14);
    head.scale.setScalar([1.06, 0.97, 0.93][stage - 1]);
    dog.add(head);
    oval(
      head,
      fur,
      [0, 0.08, 0],
      adolescent ? [0.59, 0.56, 0.52] : [0.68, 0.61, 0.56],
    );
    [-1, 1].forEach((side) => {
      if (adolescent) {
        // A perky ear and a softly folded ear create a distinct teenage silhouette.
        const ear = oval(
          head,
          earFur,
          [side * 0.46, side === -1 ? 0.57 : 0.4, -0.07],
          [0.19, side === -1 ? 0.38 : 0.3, 0.17],
        );
        ear.rotation.z = side * 0.3;
        oval(
          head,
          pink,
          [side * 0.46, side === -1 ? 0.59 : 0.43, 0.075],
          [0.095, side === -1 ? 0.23 : 0.16, 0.04],
        ).rotation.z = side * 0.3;
        if (side === 1) {
          oval(head, earFur, [0.54, 0.62, 0.1], [0.18, 0.13, 0.19]).rotation.z =
            -0.4;
        }
      } else {
        const ear = oval(
          head,
          earFur,
          [side * 0.6, -0.06, -0.02],
          [0.22, 0.49, 0.25],
        );
        ear.rotation.z = side * 0.22;
        oval(
          head,
          pink,
          [side * 0.63, -0.12, 0.17],
          [0.105, 0.27, 0.065],
        ).rotation.z = side * 0.2;
      }
      oval(
        head,
        cream,
        [side * 0.15, -0.2, adolescent ? 0.55 : 0.49],
        adolescent ? [0.21, 0.17, 0.27] : [0.25, 0.2, 0.19],
      );
      if (!adolescent)
        oval(head, pink, [side * 0.41, -0.12, 0.44], [0.12, 0.05, 0.025]);
    });
    const eyes = [-1, 1].map((side) => {
      const eye = new THREE.Group();
      eye.position.set(
        side * (adolescent ? 0.24 : 0.27),
        0.16,
        adolescent ? 0.46 : 0.49,
      );
      head.add(eye);
      oval(
        eye,
        black,
        [0, 0, 0],
        adolescent ? [0.09, 0.115, 0.07] : [0.105, 0.135, 0.07],
      );
      oval(eye, white, [-0.025, 0.04, 0.059], [0.029, 0.035, 0.014]);
      oval(eye, white, [0.03, -0.035, 0.064], [0.012, 0.015, 0.01]);
      return eye;
    });
    oval(head, black, [0, -0.1, adolescent ? 0.8 : 0.67], [0.145, 0.105, 0.08]);
    oval(
      head,
      black,
      [0, -0.31, adolescent ? 0.75 : 0.61],
      [0.13, 0.08, 0.035],
    );
    const tongue = oval(
      head,
      pink,
      [0, -0.37, adolescent ? 0.778 : 0.638],
      [0.075, 0.1, 0.03],
    );
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.065, 12, 40),
      blue,
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, headY - 0.46, 0.12);
    dog.add(collar);
    if (adolescent) {
      const scarf = new THREE.Shape();
      scarf.moveTo(-0.32, 0);
      scarf.lineTo(0.32, 0);
      scarf.lineTo(0, -0.42);
      scarf.closePath();
      const scarfMaterial = material(0x0f2bc7);
      scarfMaterial.side = THREE.DoubleSide;
      const bandana = new THREE.Mesh(
        new THREE.ShapeGeometry(scarf),
        scarfMaterial,
      );
      bandana.position.set(0, headY - 0.43, 0.55);
      bandana.castShadow = true;
      dog.add(bandana);
      oval(dog, blue, [0.35, headY - 0.44, 0.07], [0.13, 0.1, 0.13]);
    }
    oval(
      dog,
      gold,
      [0, headY - (adolescent ? 0.64 : 0.53), adolescent ? 0.59 : 0.49],
      [0.09, 0.11, 0.035],
    );
    const tail = new THREE.Group();
    tail.position.set(0.39, 0.49, -0.37);
    dog.add(tail);
    if (adolescent) tail.scale.set(1.25, 0.8, 0.8);
    const tailMesh = oval(tail, fur, [0.28, 0.19, -0.07], [0.43, 0.15, 0.16]);
    tailMesh.rotation.z = 0.5;
    oval(tail, cream, [0.61, 0.35, -0.07], [0.15, 0.14, 0.15]);
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(1.7, 1.8, 0.13, 64),
      material(0xe1e6ff),
    );
    platform.position.y = -0.08;
    platform.receiveShadow = true;
    scene.add(platform);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), gold);
    ball.position.set(-1, 0.2, 0.65);
    ball.castShadow = true;
    scene.add(ball);
    const ballStripe = new THREE.Mesh(
      new THREE.TorusGeometry(0.157, 0.018, 8, 32),
      blue,
    );
    ball.add(ballStripe);
    const treat = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.07, 0.25),
      earFur,
    );
    treat.visible = false;
    scene.add(treat);
    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    const raycaster = new THREE.Raycaster();
    let pointerDown;
    const down = (event) => {
      pointerDown = [event.clientX, event.clientY];
    };
    const up = (event) => {
      if (
        !pointerDown ||
        Math.hypot(
          event.clientX - pointerDown[0],
          event.clientY - pointerDown[1],
        ) > 8
      )
        return;
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          (-(event.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      if (raycaster.intersectObject(dog, true).length) petCallback.current();
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointerup", up);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = true;
    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
    });
    intersection.observe(container);
    let lastFrame = 0;
    renderer.setAnimationLoop((now) => {
      if (document.hidden || !inView || now - lastFrame < 33) return;
      lastFrame = now;
      const t = now / 1000;
      const elapsed = (Date.now() - (currentAction.current?.at || 0)) / 1000;
      const active = elapsed < 3;
      const type = active ? currentAction.current?.type : "idle";
      const moving = !reducedMotion.matches;
      tail.rotation.y = moving
        ? Math.sin(t * (active ? 15 : 4)) * (active ? 0.65 : 0.18)
        : 0;
      head.rotation.z = moving
        ? Math.sin(t * 1.5) * (type === "pet" ? 0.15 : 0.035)
        : 0;
      head.rotation.x = moving && type === "treat" ? Math.sin(t * 10) * 0.1 : 0;
      body.scale.y = bodyHeight * (moving ? 1 + Math.sin(t * 2) * 0.015 : 1);
      dog.position.y =
        moving && type === "play" ? Math.abs(Math.sin(elapsed * 5)) * 0.28 : 0;
      dog.rotation.y =
        moving && type === "play" ? Math.sin(elapsed * 3) * 0.22 : 0;
      const blink = moving && t % 4.5 > 4.3 ? 0.12 : 1;
      eyes.forEach((eye) => {
        eye.scale.y = blink;
      });
      tongue.scale.y = type === "pet" ? 0.13 : 0.1;
      ball.position.y =
        moving && type === "play"
          ? 0.18 + Math.abs(Math.sin(elapsed * 5 + 0.8)) * 0.65
          : 0.2;
      ball.position.x = moving && type === "play" ? Math.sin(elapsed * 2) : -1;
      ball.rotation.z = moving && type === "play" ? t * 4 : 0;
      treat.visible = type === "treat";
      treat.position.set(0, headY - 0.3, 1.05);
      controls.update();
      renderer.render(scene, camera);
    });
    return () => {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      intersection.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointerup", up);
      const materials = new Set();
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (object.material) materials.add(object.material);
      });
      materials.forEach((mat) => mat.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [stage]);

  return (
    <div
      className="dog-scene"
      ref={host}
      role="img"
      aria-label={`Interactive 3D ${["puppy", "adolescent dog", "adult dog"][stage - 1]}. Use the buttons below to interact.`}
    >
      {unavailable && (
        <div className="dog-scene-fallback">
          <span aria-hidden="true">🐶</span>
          <p>
            Your companion is here! This device cannot display the 3D view. You
            can still use the interaction buttons.
          </p>
        </div>
      )}
    </div>
  );
}
