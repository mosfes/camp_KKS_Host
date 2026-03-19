"use client";

import { HeroUIProvider } from "@heroui/react";
import Tabs from './tabs.jsx'
import { HeadteacherNavbar } from "@/components/Headteacher";
import { StatusModalProvider } from "@/components/StatusModalProvider";

import {
    Button,
    ButtonGroup,
} from "@heroui/react";


const page = () => {
    return (
        <HeroUIProvider>
            <StatusModalProvider>
                <HeadteacherNavbar />
                <div className='m-4 md:m-10 mt-5'>
                    <div >
                        {/* <Card /> */}
                        {/* <Add /> */}
                        <h1 className="text-2xl ">แดชบอร์ดผู้ดูแลระบบ</h1>
                        <p>จัดการผู้ใช้และห้องเรียน</p>
                    </div>
                    <div className='mt-5'>
                        <Tabs />
                    </div>


                </div>
            </StatusModalProvider>
        </HeroUIProvider>
    )
}
export default page