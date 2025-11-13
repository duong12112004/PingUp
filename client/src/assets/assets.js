import logo from './logo.svg'
import sample_cover from './sample_cover.jpg'
import sample_profile from './sample_profile.jpg'
import bgImage from './bgImage.png'
import group_users from './group_users.png'
import { Home, MessageCircle, Search, UserIcon, Users } from 'lucide-react'
import sponsored_img from './sponsored_img.png'

export const assets = {
    logo,
    sample_cover,
    sample_profile,
    bgImage,
    group_users,
    sponsored_img
}

export const menuItemsData = [
    { to: '/', label: 'Bảng tin', Icon: Home },
    { to: '/messages', label: 'Tin nhắn', Icon: MessageCircle },
    { to: '/connections', label: 'Kết nối', Icon: Users },
    { to: '/discover', label: 'Mọi người', Icon: Search },
    { to: '/profile', label: 'Trang cá nhân', Icon: UserIcon },
];