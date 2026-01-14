import { useContext } from 'react'; // Removed unused React import
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    FileText,
    Euro,
    ClipboardCheck,
    LogOut,
    User,
    GraduationCap
} from 'lucide-react';

const Layout = () => {
    const auth = useContext(AuthContext);
    const location = useLocation();

    const navigation = [
        { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard' },
        { icon: Users, label: 'Recrutement / Kanban', path: '/candidats' },
        { icon: FileText, label: 'Contrats & Avenants', path: '/contrats' },
        { icon: GraduationCap, label: 'Pédagogie', path: '/pedagogie' },
        { icon: Euro, label: 'Finance', path: '/finance' }, // Changed to new structure
        { icon: ClipboardCheck, label: 'Qualité', path: '/qualite' }, // Changed to new structure
    ];

    const isActive = (path: string) => location.pathname.startsWith(path);

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900 text-white flex flex-col fixed h-full transition-all duration-300">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
                        CFA Manager
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">v1.0.0</p>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const isCurrent = isActive(item.path);
                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={`
                                                group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                                                ${isCurrent
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                    }
                                            `}
                            >
                                <item.icon
                                    className={`
                                                    mr-3 flex-shrink-0 h-5 w-5 transition-colors
                                                    ${isCurrent ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                                                `}
                                    aria-hidden="true"
                                />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                            {auth?.user?.sub?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-white truncate max-w-[120px]">{auth?.user?.sub}</p>
                            <p className="text-xs text-gray-500">{auth?.user?.role || 'User'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Wrapper */}
            <div className="flex-1 ml-64 flex flex-col">
                {/* Header */}
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8 sticky top-0 z-10">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {navigation.find(n => isActive(n.path))?.label || 'Dashboard'}
                    </h2>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={auth?.logout}
                            className="flex items-center text-gray-500 hover:text-red-600 transition-colors px-3 py-2 rounded-md hover:bg-red-50 text-sm font-medium"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Déconnexion
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
