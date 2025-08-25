import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const services = [
  { name: "Cryotherapy", color: "#8B5CF6", position: [3, 0, 0] as [number, number, number] },
  { name: "Red Light Therapy", color: "#EF4444", position: [1.5, 2.6, 0] as [number, number, number] },
  { name: "IV Therapy", color: "#10B981", position: [-1.5, 2.6, 0] as [number, number, number] },
  { name: "Hyperbaric Oxygen", color: "#3B82F6", position: [-3, 0, 0] as [number, number, number] },
  { name: "Salt Therapy", color: "#F59E0B", position: [-1.5, -2.6, 0] as [number, number, number] },
  { name: "Wellness Suites", color: "#EC4899", position: [1.5, -2.6, 0] as [number, number, number] },
];

const ServiceSphere = ({ service, index }: { service: any; index: number }) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Circular rotation
      const radius = 3;
      const angle = state.clock.elapsedTime * 0.3 + (index * Math.PI * 2) / services.length;
      meshRef.current.position.x = Math.cos(angle) * radius;
      meshRef.current.position.z = Math.sin(angle) * radius;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime + index) * 0.3;
      
      // Sphere rotation
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.3 : 1}
    >
      <sphereGeometry args={[0.6, 32, 32]} />
      <meshStandardMaterial 
        color={service.color} 
        roughness={0.1}
        metalness={0.9}
        emissive={service.color}
        emissiveIntensity={0.2}
      />
      <Text
        position={[0, -1.2, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
      >
        {service.name}
      </Text>
    </mesh>
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
          <div className="h-[600px] w-full relative">
            <Canvas 
              camera={{ position: [0, 2, 8], fov: 60 }}
              gl={{ antialias: true, alpha: true }}
              style={{ background: 'transparent' }}
            >
              <ambientLight intensity={0.4} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <pointLight position={[0, 0, 0]} intensity={0.8} color="#8B5CF6" />
              <pointLight position={[5, 5, 5]} intensity={0.6} color="#EC4899" />
              
              {services.map((service, index) => (
                <ServiceSphere key={service.name} service={service} index={index} />
              ))}
              
              <OrbitControls 
                enableZoom={false} 
                autoRotate 
                autoRotateSpeed={1}
                enablePan={false}
                maxPolarAngle={Math.PI / 1.8}
                minPolarAngle={Math.PI / 3}
              />
            </Canvas>
            
            {/* Loading fallback */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-white/50 text-sm">Loading 3D Experience...</div>
            </div>
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