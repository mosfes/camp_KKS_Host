"use client";

import Image from "next/image";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";

export default function SignInSide() {
  // const router = useRouter();
  // const [account, setAccount] = useState({ username: "", password: "" });

  // useEffect(() => {
  //   if (authService.isLoggedIn()) router.push("/home");
  // }, [router]);

  // const handelLogin = () => {
  //   authService.doLogIn(account.username);
  //   router.push("/home");
  // };
  const sizes: ("sm" | "md" | "lg")[] = ["sm"];

  return (
    <div className="min-h-screen w-full bg-[#f5f0e7] flex flex-col items-center justify-center px-4">
      {/* Logo + Title */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image
            alt="EduCamp Logo"
            className="rounded-full bg-[#6b7f73]"
            height={72}
            src="/images/login.png"
            width={72}
          />
        </div>
        <h1 className="text-2xl text-gray-700 font-semibold">EduCamp</h1>
      </div>

      {/* Card */}
      <Card
        className="
          w-full max-w-md
          rounded-2xl
          bg-white
          border
          border-gray-200
          shadow-lg
        "
      >
        <CardBody className="p-8 space-y-5">
          <div>
            <h2 className="text-xl text-gray-600 font-semibold">
              Welcome Back
            </h2>
            <p className="text-gray-500 text-sm">
              Sign in to create and manage camps
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Email</p>
            <div className="w-full flex flex-col gap-4 mt-2 mb-3">
              {sizes.map((size) => (
                <div
                  key={size}
                  className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4"
                >
                  <Input label="Email" size={size} type="email" />
                </div>
              ))}
            </div>

            <p className="text-gray-500 text-sm">Password</p>
            <div className="w-full flex flex-col gap-4 mt-2">
              {sizes.map((size) => (
                <div
                  key={size}
                  className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4"
                >
                  <Input label="Password" size={size} type="password" />
                </div>
              ))}
            </div>
          </div>

          <Button
            className="
    w-full
    rounded-full
    bg-[#5d7c6f]
    text-white
    border
    border-[#5d7c6f]
    transition-colors
    hover:bg-white
    hover:text-[#5d7c6f]
    hover:border-[#5d7c6f]
  "
            color="primary"
          >
            Sign in
          </Button>

          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              className="font-medium text-[#5d7c6f] hover:text-primary"
              href="#"
            >
              ติดต่อแอดมิน
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
