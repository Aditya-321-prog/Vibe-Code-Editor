import React from "react";



const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-10 bg-zinc-900">
      {children}
    </div>
  );
};

export default AuthLayout;

