import React from 'react';
import { motion } from 'framer-motion';
import { Truck, CheckCircle, ArrowRight } from 'lucide-react';

interface AnimatedWelcomeProps {
    userName?: string;
    message?: string;
    onComplete?: () => void;
}

const AnimatedWelcome: React.FC<AnimatedWelcomeProps> = ({ 
    userName = 'there',
    message = 'Redirecting to your dashboard',
    onComplete 
}) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-blue-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-center max-w-md"
            >
                {/* Animated Icon */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                        delay: 0.2, 
                        duration: 0.6, 
                        type: "spring",
                        stiffness: 200
                    }}
                    className="mb-6 inline-block"
                >
                    <div className="relative">
                        {/* Pulsing Background Circle */}
                        <motion.div
                            animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 0.2, 0.5]
                            }}
                            transition={{ 
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute inset-0 bg-blue-400 rounded-full blur-xl"
                        />
                        
                        {/* Main Icon Circle */}
                        <div className="relative w-24 h-24 bg-linear-to-br from-blue-600 to-blue-700 rounded-full shadow-xl flex items-center justify-center">
                            <Truck className="w-12 h-12 text-white" />
                        </div>
                        
                        {/* Check Badge */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
                            className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                        >
                            <CheckCircle className="w-6 h-6 text-white" />
                        </motion.div>
                    </div>
                </motion.div>

                {/* Welcome Text */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Welcome back, <span className="text-blue-600">{userName}</span>!
                    </h1>
                    <p className="text-lg text-gray-600 mb-6">{message}...</p>
                </motion.div>

                {/* Loading Dots */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-center gap-2 mb-8"
                >
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                y: [0, -10, 0],
                                opacity: [1, 0.5, 1]
                            }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "easeInOut"
                            }}
                            className="w-3 h-3 bg-blue-600 rounded-full"
                        />
                    ))}
                </motion.div>

                {/* Progress Bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="w-full max-w-xs mx-auto"
                >
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ 
                                duration: 2, 
                                ease: "easeInOut"
                            }}
                            onAnimationComplete={onComplete}
                            className="h-full bg-linear-to-r from-blue-600 to-blue-400 rounded-full"
                        />
                    </div>
                </motion.div>

                {/* Optional Skip Button */}
                {onComplete && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        onClick={onComplete}
                        className="mt-6 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mx-auto transition-colors"
                    >
                        Skip
                        <ArrowRight className="w-4 h-4" />
                    </motion.button>
                )}
            </motion.div>
        </div>
    );
};

export default AnimatedWelcome;
