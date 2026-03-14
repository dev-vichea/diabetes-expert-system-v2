import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  UserPlus 
} from "lucide-react";
import { notificationsData } from "@/lib/data";
import { cn } from "@/lib/utils";

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const colorMap = {
  info: "bg-blue-100 text-blue-600",
  success: "bg-green-100 text-green-600",
  warning: "bg-yellow-100 text-yellow-600",
  error: "bg-red-100 text-red-600",
};

export default function Notifications() {
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
  });

  const handleSettingChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Recent Notifications */}
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-stone-900">Recent Notifications</CardTitle>
              <Button variant="secondary" size="sm">
                Mark all as read
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="divide-y divide-stone-200">
              {notificationsData.map((notification) => {
                const Icon = iconMap[notification.type];
                
                return (
                  <div key={notification.id} className="p-6 hover:bg-stone-50 transition-colors duration-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          colorMap[notification.type]
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-normal text-stone-900">{notification.title}</p>
                          <span className="text-xs text-stone-500">{notification.time}</span>
                        </div>
                        <p className="text-sm text-stone-600 mt-1">{notification.message}</p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 ml-2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-stone-900">Notification Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-normal text-stone-900">Email notifications</p>
                  <p className="text-sm text-stone-500">Receive notifications via email</p>
                </div>
                <Switch 
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={() => handleSettingChange('emailNotifications')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-normal text-stone-900">Push notifications</p>
                  <p className="text-sm text-stone-500">Receive push notifications in browser</p>
                </div>
                <Switch 
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={() => handleSettingChange('pushNotifications')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-normal text-stone-900">SMS notifications</p>
                  <p className="text-sm text-stone-500">Receive important updates via SMS</p>
                </div>
                <Switch 
                  checked={notificationSettings.smsNotifications}
                  onCheckedChange={() => handleSettingChange('smsNotifications')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
