import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, MeshWobbleMaterial } from '@react-three/drei';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const services = [
  { name: "Cryotherapy", color: "#8B5CF6", position: [3, 0, 0] },
  { name: "Red Light Therapy", color: "#EF4444", position: [1.5, 2.6, 0] },
  { name: "IV Therapy", color: "#10B981", position: [-1.5, 2.6, 0] },
  { name: "Hyperbaric Oxygen", color: "#3B82F6", position: [-3, 0, 0] },
  { name: "Salt Therapy", color: "#F59E0B", position: [-1.5, -2.6, 0] },
  { name: "Wellness Suites", color: "#EC4899", position: [1.5, -2.6, 0] },
];

const ServiceSphere = ({ service, index }: { service: any; index: number }) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5 + (index * Math.PI / 3);
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime + index) * 0.2;
    }
  });

  return (
    <group position={service.position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.2 : 1}
      >
        <sphereGeometry args={[0.8, 32, 32]} />
        <MeshWobbleMaterial 
          color={service.color} 
          factor={0.3}
          speed={2}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/serif.woff"
      >
        {service.name}
      </Text>
    </group>
  );
};

const ServicesWheel = () => {
  return (
    <section className="py-24 bg-gradient-dark relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-5xl sm:text-6xl font-light text-white mb-6">
            Our <span className="text-primary text-glow">Services</span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Explore our cutting-edge wellness technologies in an immersive 3D experience
          </p>
        </div>

        <div className="relative">
          {/* 3D Canvas */}
          <div className="h-[600px] w-full">
            <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
              <ambientLight intensity={0.3} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8B5CF6" />
              
              {services.map((service, index) => (
                <ServiceSphere key={service.name} service={service} index={index} />
              ))}
              
              <OrbitControls 
                enableZoom={false} 
                autoRotate 
                autoRotateSpeed={0.5}
                enablePan={false}
                maxPolarAngle={Math.PI / 2}
                minPolarAngle={Math.PI / 2}
              />
            </Canvas>
          </div>

          {/* Overlay Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="glass-card p-6 rounded-2xl">
              <p className="text-white/80 text-sm mb-4 text-center">
                Drag to explore • Click to interact
              </p>
              <div className="flex gap-4">
                <Link to="/services">
                  <Button className="btn-luxury">
                    View All Services
                  </Button>
                </Link>
                <Link to="/book">
                  <Button variant="outline" className="btn-ghost-luxury">
                    Book Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Service Grid for Mobile */}
        <div className="md:hidden mt-16 grid grid-cols-2 gap-4">
          {services.map((service) => (
            <div key={service.name} className="glass-card p-4 rounded-xl">
              <div 
                className="w-4 h-4 rounded-full mb-2"
                style={{ backgroundColor: service.color }}
              ></div>
              <h3 className="text-white font-medium">{service.name}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
    </section>
  );
};

export default ServicesWheel;