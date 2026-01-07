"use client";

import NavTest from '../../components/navbar.tsx'
import { HeroUIProvider } from "@heroui/react";
import Tabs from './tabs.jsx'
import Card from './card.jsx'
import Add from './add.jsx' 
import { AppNavbar } from "@/components/StudentNavbar";

import {
    Button,
    ButtonGroup,
} from "@heroui/react";


const page = () => {
    return (
        <HeroUIProvider>
           
            <AppNavbar />
            <div className='m-10 mt-5'>
                <div >
                    <Card />
                    {/* <Add /> */}
                    {/* <h1 className="text-2xl ">แดชบอร์ดผู้ดูแลระบบ</h1>
                    <p>จัดการนักเรียนและครู</p> */}
                </div>
                <div className='mt-5'>
                    <Tabs />    
                </div>

                
            </div>
             

            

        </HeroUIProvider>
    )
}
export default page