import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MoreVertical, 
  Palette, 
  TrendingUp, 
  Bug, 
  Smartphone, 
  Tag, 
  ShoppingBag 
} from "lucide-react";
import { projectsData } from "@/lib/data";
import { cn } from "@/lib/utils";

const getProjectIcon = (iconName: string) => {
  const iconProps = { className: "w-4 h-4" };
  
  switch (iconName) {
    case 'palette':
      return <Palette {...iconProps} />;
    case 'chart-line':
      return <TrendingUp {...iconProps} />;
    case 'bug':
      return <Bug {...iconProps} />;
    case 'smartphone':
      return <Smartphone {...iconProps} />;
    case 'tag':
      return <Tag {...iconProps} />;
    case 'shopping-bag':
      return <ShoppingBag {...iconProps} />;
    default:
      return <Palette {...iconProps} />;
  }
};

export function ProjectsTable() {
  return (
    <Card className="border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Projects</CardTitle>
            <div className="text-sm text-gray-500 flex items-center mt-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
              30 done this month
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                  COMPANIES
                </th>
                <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                  MEMBERS
                </th>
                <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                  BUDGET
                </th>
                <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                  COMPLETION
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projectsData.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center mr-3",
                        project.iconColor
                      )}>
                        {getProjectIcon(project.icon)}
                      </div>
                      <span className="font-normal text-gray-900">{project.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex -space-x-2">
                      {project.members.map((member) => (
                        <Avatar key={member.id} className="w-8 h-8 border-2 border-white">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className={cn("text-white text-xs", member.color)}>
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.budget}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">{project.completion}%</span>
                      <Progress 
                        value={project.completion} 
                        className="w-32 h-2"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
