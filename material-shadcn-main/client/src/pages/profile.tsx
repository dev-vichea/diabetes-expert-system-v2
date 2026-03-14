import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Smartphone, MessageCircle, Settings, Edit, Facebook, Twitter, Instagram } from "lucide-react";
import { messagesData } from "@/lib/data";
import type { SettingsState } from "@/lib/types";

export default function Profile() {
  const [settings, setSettings] = useState<SettingsState>({
    emailOnFollow: true,
    emailOnReply: false,
    emailOnMention: true,
    newLaunches: false,
    monthlyUpdates: true,
    newsletter: false,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
  });

  const handleSettingChange = (key: keyof SettingsState) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const userProfile = {
    name: "Richard Davis",
    title: "CEO / Co-Founder",
    firstName: "Alec M. Thompson",
    mobile: "(44) 123 1234 123",
    email: "alecthompson@mail.com",
    location: "USA",
    bio: "Hi, I'm Alec Thompson, Decisions: If you can't decide, the answer is no. If two equally difficult paths, choose the one more painful in the short term (pain avoidance is creating an illusion of equality).",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"
  };

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-stone-900 rounded-xl p-8 mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="w-16 h-16 border-2 border-white/20">
                  <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                  <AvatarFallback className="bg-stone-700 text-white">
                    {userProfile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <h2 className="text-2xl font-bold text-white">{userProfile.name}</h2>
                  <p className="text-white/80">{userProfile.title}</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20 hover:text-white border-0">
                  <Smartphone className="mr-2 w-4 h-4" />
                  App
                </Button>
                <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20 hover:text-white border-0">
                  <MessageCircle className="mr-2 w-4 h-4" />
                  Message
                </Button>
                <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20 hover:text-white border-0">
                  <Settings className="mr-2 w-4 h-4" />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Platform Settings */}
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-stone-900">Platform Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-normal text-stone-900 mb-3">ACCOUNT</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-700">Email me when someone follows me</span>
                    <Switch 
                      checked={settings.emailOnFollow}
                      onCheckedChange={() => handleSettingChange('emailOnFollow')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-700">Email me when someone answers on my post</span>
                    <Switch 
                      checked={settings.emailOnReply}
                      onCheckedChange={() => handleSettingChange('emailOnReply')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-700">Email me when someone mentions me</span>
                    <Switch 
                      checked={settings.emailOnMention}
                      onCheckedChange={() => handleSettingChange('emailOnMention')}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-normal text-stone-900 mb-3">APPLICATION</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-700">New launches and projects</span>
                    <Switch 
                      checked={settings.newLaunches}
                      onCheckedChange={() => handleSettingChange('newLaunches')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-700">Monthly product updates</span>
                    <Switch 
                      checked={settings.monthlyUpdates}
                      onCheckedChange={() => handleSettingChange('monthlyUpdates')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-700">Subscribe to newsletter</span>
                    <Switch 
                      checked={settings.newsletter}
                      onCheckedChange={() => handleSettingChange('newsletter')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card className="border-stone-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-stone-900">Profile Information</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary-500 hover:text-primary-600">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-6">
                {userProfile.bio}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-normal text-gray-900">First Name:</label>
                  <p className="text-sm text-gray-600 mt-1">{userProfile.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-normal text-gray-900">Mobile:</label>
                  <p className="text-sm text-gray-600 mt-1">{userProfile.mobile}</p>
                </div>
                <div>
                  <label className="text-sm font-normal text-gray-900">Email:</label>
                  <p className="text-sm text-gray-600 mt-1">{userProfile.email}</p>
                </div>
                <div>
                  <label className="text-sm font-normal text-gray-900">Location:</label>
                  <p className="text-sm text-gray-600 mt-1">{userProfile.location}</p>
                </div>
                <div>
                  <label className="text-sm font-normal text-gray-900">Social:</label>
                  <div className="flex space-x-3 mt-1">
                    <Button variant="ghost" size="sm" className="p-1 h-auto text-blue-600 hover:text-blue-700">
                      <Facebook className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1 h-auto text-blue-400 hover:text-blue-500">
                      <Twitter className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1 h-auto text-pink-600 hover:text-pink-700">
                      <Instagram className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Platform Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {messagesData.map((message) => (
                  <div key={message.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={message.avatar} alt={message.sender} />
                        <AvatarFallback>
                          {message.sender.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <p className="text-sm font-normal text-gray-900">{message.sender}</p>
                        <p className="text-xs text-gray-500">{message.preview}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs font-normal text-primary-600 border-primary-200 hover:bg-primary-50"
                    >
                      REPLY
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
