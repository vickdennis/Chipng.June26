import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Users, FileText, ShoppingBag, BarChart3, Trash2, PowerOff, ArrowLeft } from "lucide-react";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "blogs" | "products">("analytics");
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalProducts: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [newBlog, setNewBlog] = useState({ title: "", content: "" });
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: 0 });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      if (activeTab === "analytics") {
        const data = await api.admin.getAnalytics();
        setStats(data);
      } else if (activeTab === "users") {
        const data = await api.admin.getUsers();
        setUsers(data);
      } else if (activeTab === "blogs") {
        const data = await api.admin.getBlogs();
        setBlogs(data);
      } else if (activeTab === "products") {
        const data = await api.admin.getProducts();
        setProducts(data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load data.");
    }
    setIsLoading(false);
  };

  const suspendUser = async (id: string) => {
    try {
      await api.admin.suspendUser(id);
      alert("User suspended successfully.");
      fetchData();
    } catch (e: any) {
      alert("Failed: " + e.message);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.admin.deleteUser(id);
      fetchData();
    } catch (e: any) {
      alert("Failed: " + e.message);
    }
  };

  const createBlog = async () => {
    if (!newBlog.title) return alert("Title required");
    try {
      await api.admin.createBlog(newBlog.title, newBlog.content);
      setNewBlog({ title: "", content: "" });
      fetchData();
    } catch (e: any) {
      alert("Failed: " + e.message);
    }
  };

  const deleteBlog = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
       await api.admin.deleteBlog(id);
       fetchData();
    } catch (e: any) {
       alert("Failed: " + e.message);
    }
  };

  const createProduct = async () => {
    if (!newProduct.name || newProduct.price < 0) return alert("Valid name and price required");
    try {
      await api.admin.createProduct(newProduct.name, newProduct.description, newProduct.price);
      setNewProduct({ name: "", description: "", price: 0 });
      fetchData();
    } catch (e: any) {
      alert("Failed: " + e.message);
    }
  };

  const deleteProduct = async (id: string) => {
     if (!confirm("Are you sure?")) return;
     try {
       await api.admin.deleteProduct(id);
       fetchData();
     } catch (e: any) {
       alert("Failed: " + e.message);
     }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 border-t-4 border-indigo-600">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="flex justify-between items-center mb-10 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
             <button onClick={() => { window.location.href="/dashboard"; }} className="text-slate-400 hover:text-slate-600">
               <ArrowLeft className="w-5 h-5" />
             </button>
             <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          </div>
        </header>
        
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 space-y-2">
             <button onClick={() => setActiveTab("analytics")} className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === 'analytics' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                <BarChart3 className="w-5 h-5" /> Analytics
             </button>
             <button onClick={() => setActiveTab("users")} className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                <Users className="w-5 h-5" /> App Users
             </button>
             <button onClick={() => setActiveTab("blogs")} className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === 'blogs' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                <FileText className="w-5 h-5" /> Blog Posts
             </button>
             <button onClick={() => setActiveTab("products")} className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === 'products' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                <ShoppingBag className="w-5 h-5" /> Shop Products
             </button>
          </aside>
          
          <main className="flex-1 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
             {isLoading ? (
                <div className="flex animate-pulse gap-2 text-slate-400 items-center justify-center p-20"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> Loading data...</div>
             ) : errorMsg ? (
                <div className="text-red-500 bg-red-50 p-4 rounded-lg">{errorMsg}</div>
             ) : (
                <>
                   {activeTab === "analytics" && (
                     <div>
                       <h2 className="text-xl font-bold mb-6">Platform Statistics</h2>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl">
                             <div className="text-slate-500 font-medium mb-1">Total Users</div>
                             <div className="text-4xl font-bold text-indigo-600">{stats.totalUsers}</div>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl">
                             <div className="text-slate-500 font-medium mb-1">Published Posts</div>
                             <div className="text-4xl font-bold text-indigo-600">{stats.totalPosts}</div>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl">
                             <div className="text-slate-500 font-medium mb-1">Active Products</div>
                             <div className="text-4xl font-bold text-indigo-600">{stats.totalProducts}</div>
                          </div>
                       </div>
                     </div>
                   )}

                   {activeTab === "users" && (
                     <div>
                        <h2 className="text-xl font-bold mb-6">User Management</h2>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left border-collapse">
                             <thead>
                               <tr className="border-b border-slate-200 text-sm p-4 text-slate-500">
                                 <th className="py-3 px-4 font-medium">Username</th>
                                 <th className="py-3 px-4 font-medium">Email</th>
                                 <th className="py-3 px-4 font-medium">Role</th>
                                 <th className="py-3 px-4 font-medium text-right">Actions</th>
                               </tr>
                             </thead>
                             <tbody>
                               {users.map(u => (
                                 <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                   <td className="py-3 px-4 font-medium text-indigo-900">{u.username || u.display_name}</td>
                                   <td className="py-3 px-4 text-slate-600">{u.email || '-'}</td>
                                   <td className="py-3 px-4"><span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{u.role}</span></td>
                                   <td className="py-3 px-4 text-right">
                                     {u.role !== 'admin' && (
                                       <div className="flex justify-end gap-2">
                                          <button onClick={() => suspendUser(u.id)} className="p-2 text-amber-500 hover:bg-amber-50 rounded" title="Suspend"><PowerOff className="w-4 h-4" /></button>
                                          <button onClick={() => deleteUser(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                       </div>
                                     )}
                                   </td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                           {users.length === 0 && <p className="text-slate-500 italic mt-6 text-center">No users found.</p>}
                        </div>
                     </div>
                   )}

                   {activeTab === "blogs" && (
                     <div>
                        <h2 className="text-xl font-bold mb-6">Blog Content</h2>
                        <div className="bg-slate-50 p-6 rounded-xl mb-8 border border-slate-200">
                           <h3 className="font-semibold mb-4">Create New Post</h3>
                           <div className="space-y-4 max-w-lg">
                              <input placeholder="Post Title" className="w-full border border-slate-300 rounded p-3" value={newBlog.title} onChange={e => setNewBlog({...newBlog, title: e.target.value})} />
                              <textarea placeholder="Post content..." className="w-full border border-slate-300 rounded p-3 h-24" value={newBlog.content} onChange={e => setNewBlog({...newBlog, content: e.target.value})}></textarea>
                              <button onClick={createBlog} className="bg-indigo-600 text-white px-5 py-2 rounded font-medium hover:bg-indigo-700">Publish Post</button>
                           </div>
                        </div>

                        <div className="grid gap-4">
                           {blogs.map(b => (
                             <div key={b.id} className="flex items-center justify-between p-5 border border-slate-200 rounded-xl hover:shadow-sm">
                                <div>
                                   <div className="font-bold text-lg">{b.title}</div>
                                   <div className="text-slate-500 text-sm mt-1">{new Date(b.created_at).toLocaleDateString()}</div>
                                </div>
                                <button onClick={() => deleteBlog(b.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5"/></button>
                             </div>
                           ))}
                           {blogs.length === 0 && <p className="text-slate-500 italic">No posts documented yet.</p>}
                        </div>
                     </div>
                   )}

                   {activeTab === "products" && (
                     <div>
                        <h2 className="text-xl font-bold mb-6">Product Catalog</h2>
                        <div className="bg-slate-50 p-6 rounded-xl mb-8 border border-slate-200">
                           <h3 className="font-semibold mb-4">Add Product</h3>
                           <div className="space-y-4 max-w-lg">
                              <input placeholder="Product Name" className="w-full border border-slate-300 rounded p-3" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                              <input placeholder="Description" className="w-full border border-slate-300 rounded p-3" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                              <input type="number" placeholder="Price" className="w-full border border-slate-300 rounded p-3" value={newProduct.price || ""} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                              <button onClick={createProduct} className="bg-indigo-600 text-white px-5 py-2 rounded font-medium hover:bg-indigo-700">Add Product</button>
                           </div>
                        </div>

                        <div className="grid gap-4">
                           {products.map(p => (
                             <div key={p.id} className="flex items-center justify-between p-5 border border-slate-200 rounded-xl hover:shadow-sm">
                                <div>
                                   <div className="font-bold text-lg">{p.name}</div>
                                   <div className="text-slate-500 text-sm mt-1">${Number(p.price).toFixed(2)}</div>
                                </div>
                                <button onClick={() => deleteProduct(p.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5"/></button>
                             </div>
                           ))}
                           {products.length === 0 && <p className="text-slate-500 italic">No products available.</p>}
                        </div>
                     </div>
                   )}
                </>
             )}
          </main>
        </div>
      </div>
    </div>
  );
}
