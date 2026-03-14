import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { MoreVertical } from "lucide-react";
import { authorsData, projectsData } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function Tables() {
  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="space-y-6">
        {/* Authors Table */}
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Authors table</CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      AUTHOR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      FUNCTION
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      EMPLOYED
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-200">
                  {authorsData.map((author) => (
                    <tr key={author.id} className="hover:bg-stone-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={author.avatar} alt={author.name} />
                            <AvatarFallback>
                              {author.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="text-sm font-normal text-stone-900">{author.name}</div>
                            <div className="text-sm text-stone-500">{author.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-900">{author.role}</div>
                        <div className="text-sm text-stone-500">{author.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={author.status === 'online' ? 'default' : 'secondary'}
                          className={cn(
                            author.status === 'online' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                              : 'bg-stone-100 text-stone-800 hover:bg-stone-100'
                          )}
                        >
                          {author.status === 'online' ? 'Online' : 'Offline'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        {author.employed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                        <Button variant="secondary" size="sm">
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Projects table</CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      PROJECT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      BUDGET
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      COMPLETION
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-200">
                  {projectsData.map((project) => (
                    <tr key={project.id} className="hover:bg-stone-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm font-bold",
                            project.iconColor
                          )}>
                            {project.icon.length === 1 ? project.icon : project.icon.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-normal text-stone-900">{project.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        {project.budget}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant="secondary"
                          className={cn(
                            project.status === 'working' && 'bg-blue-100 text-blue-800 hover:bg-blue-100',
                            project.status === 'done' && 'bg-green-100 text-green-800 hover:bg-green-100',
                            project.status === 'cancelled' && 'bg-red-100 text-red-800 hover:bg-red-100'
                          )}
                        >
                          {project.status === 'working' && 'Working'}
                          {project.status === 'done' && 'Done'}
                          {project.status === 'cancelled' && 'Cancelled'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-stone-600 mr-2">{project.completion}%</span>
                          <Progress 
                            value={project.completion} 
                            className="w-32 h-2"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                        <Button variant="secondary" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
