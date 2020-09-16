// ConsoleApplication1.cpp : This file contains the 'main' function. Program execution begins and ends there.
//

/* 
    src: https://stackoverflow.com/a/30138664/1988747 
    edited to flush data to stdout and parameters to crop desktop image (from main display)
    additional src: https://github.com/bryal/DXGCap/blob/master/DXGCap/DXGIManager.hpp
    additional src: https://github.com/diederickh/screen_capture/blob/master/src/test/test_win_api_directx_research.cpp
    additional src: https://github.com/microsoftarchive/msdn-code-gallery-microsoft/tree/master/Official%20Windows%20Platform%20Sample/DXGI%20desktop%20duplication%20sample
*/

#include <io.h>
#include <fcntl.h>
#include <iostream>
#include <cstdlib>
#include <chrono>
#include <thread>

#include <Wincodec.h>             // we use WIC for saving images

#define WIDEN2(x) L ## x
#define WIDEN(x) WIDEN2(x)
#define __WFILE__ WIDEN(__FILE__)
#define HRCHECK(__expr) {hr=(__expr);if(FAILED(hr)){wprintf(L"FAILURE 0x%08X (%i)\n\tline: %u file: '%s'\n\texpr: '" WIDEN(#__expr) L"'\n",hr, hr, __LINE__,__WFILE__);goto cleanup;}}
#define RELEASE(__p) {if(__p!=nullptr){__p->Release();__p=nullptr;}}

#define TARGET_FRAME_TIME_MS 30
#define _DEBUG 0
#define SAVE_TO_DISK 0
#define DXVERSION 11

#if DXVERSION == 9
#include <d3d9.h>                 // DirectX 9 header
#pragma comment(lib, "d3d9.lib")  // link to DirectX 9 library


IDirect3D9* d3d = nullptr;
IDirect3DDevice9* device = nullptr;
IDirect3DSurface9* surface = nullptr;
D3DPRESENT_PARAMETERS parameters = { 0 };
D3DDISPLAYMODE mode;
D3DLOCKED_RECT rc;
UINT adapter = D3DADAPTER_DEFAULT;
RECT cropRect;

#elif DXVERSION == 11
#include <d3d11.h>
#pragma comment(lib, "d3d11.lib")
#include <dxgi1_2.h>
#pragma comment(lib, "dxgi.lib")

IDXGIDevice* DxgiDevice = nullptr;
IDXGIFactory2* m_Factory = nullptr;
IDXGIAdapter* DxgiAdapter = nullptr;
IDXGIOutput* deviceOutput = nullptr;
IDXGIOutput1* desktopOutput = nullptr;
IDXGIOutputDuplication* duplication;
DXGI_OUTPUT_DESC outputDesc;
D3D11_MAPPED_SUBRESOURCE map;
DXGI_OUTDUPL_DESC duplication_desc;
ID3D11Device* m_Device;
ID3D11DeviceContext* m_DeviceContext;
D3D11_BOX cropRect;
ID3D11Texture2D* staging_tex = NULL;
DXGI_OUTDUPL_FRAME_INFO frame_info;
D3D11_TEXTURE2D_DESC tex_desc;
ID3D11Texture2D* tex = NULL;
IDXGIResource* desktop_resource = NULL;
HRESULT hrG = S_OK;

#endif

UINT bytesPerPixel32 = 4;
UINT bytesPerPixel24 = 3;
UINT stride32;
UINT stride24;
UINT Height = 0;
UINT Width = 0;
UINT exportHeight = 0;
UINT exportWidth = 0;

#if DXVERSION == 9
#endif

UINT pitch;
LPBYTE output = nullptr;
LONG left;
LONG top; 
LONG right;
LONG bottom;
LPBYTE shot;
IWICImagingFactory* wicImageFactory = nullptr;
IWICBitmapEncoder* encoder = nullptr;
IPropertyBag2* pPropertybag = NULL;
int endPixelsBuffer;
int startPixelsBuffer;
int sizePixelsBuffer;

void sendIStreamToOutput (IStream * pIStream) {

    STATSTG sts;
    pIStream->Stat(&sts, STATFLAG_DEFAULT);
    ULARGE_INTEGER uli = sts.cbSize;
    LARGE_INTEGER zero;
    zero.QuadPart = 0;
    ULONG size = (ULONG)uli.QuadPart;
    char* bits = new char[size];
    ULONG written;
    pIStream->Seek(zero, STREAM_SEEK_SET, NULL);
    pIStream->Read(bits, size, &written);
    
    std::ostream& lhs = std::cout;

    _setmode(_fileno(stdout), _O_BINARY);

#if (_DEBUG == 1) || (SAVE_TO_DISK == 1)
    FILE* f;
    fopen_s(&f, "out.jpg", "wb");
    fwrite(bits, size, 1, f);
    fclose(f);
#else
    lhs.write(bits, size);
    fflush(stdout);
#endif

    delete[] bits;
 }

HRESULT SavePixels()
{
    HRESULT hr = S_OK;

    IWICBitmapFrameEncode* frame = nullptr;
    IWICStream* streamOut = nullptr;
    IStream * streamIn = nullptr;
    GUID pf = GUID_WICPixelFormat24bppRGB;

    HRCHECK(wicImageFactory->CreateEncoder(GUID_ContainerFormatJpeg, nullptr, &encoder));
    HRCHECK(wicImageFactory->CreateStream(&streamOut));
    HRCHECK(CreateStreamOnHGlobal(NULL, true, &streamIn));
    HRCHECK(streamOut->InitializeFromIStream(streamIn));
    HRCHECK(encoder->Initialize(streamOut, WICBitmapEncoderNoCache));
    HRCHECK(encoder->CreateNewFrame(&frame, &pPropertybag));
    
    {
        PROPBAG2 option = { 0 };
        option.pstrName = const_cast<LPOLESTR>(L"ImageQuality");
        VARIANT varValue;
        VariantInit(&varValue);
        varValue.vt = VT_R4;
        varValue.fltVal = 0.0; // 0 to 1; default 0.9; minimum quality
        HRCHECK(pPropertybag->Write(1, &option, &varValue));
    }

    HRCHECK(frame->Initialize(nullptr)); // we dont' use any options here
    HRCHECK(frame->SetSize(exportWidth, exportHeight));
    HRCHECK(frame->SetPixelFormat(&pf));
    HRCHECK(frame->WritePixels(exportHeight, exportWidth * bytesPerPixel24, sizePixelsBuffer, shot));
    HRCHECK(frame->Commit());
    HRCHECK(encoder->Commit());

    sendIStreamToOutput(streamOut);

cleanup:
    RELEASE(streamIn);
    RELEASE(streamOut);
    RELEASE(frame);
    RELEASE(encoder);
    RELEASE(pPropertybag);

    return hr;
}

#if DXVERSION == 9
HRESULT Direct3D9TakeScreenshots()
{
    HRESULT hr = S_OK;

    // get the data
    HRCHECK(device->GetFrontBufferData(0, surface));

    // copy it into our buffers
    HRCHECK(surface->LockRect(&rc, &cropRect, D3DLOCK_NO_DIRTY_UPDATE | D3DLOCK_READONLY));
    //CopyMemory(shot, rc.pBits, pitch * bottom - (top * pitch + bytesPerPixel * left));

    {
        LPBYTE inputBuf = (LPBYTE)rc.pBits;
        int i = 0, j = 0;

        // copy memory 32bpp to 24bpp
        for (int y = 0, i = 0, j = 0; y < (bottom - top); y++, i = y * bytesPerPixel32 * Width, j = y * stride24) {
            for (int x = left, xI = 0, xJ = 0; x < right; x++, xI = xI + bytesPerPixel32, xJ = xJ + bytesPerPixel24) {
                shot[j + xJ] = inputBuf[i + xI];
                shot[j + xJ + 1] = inputBuf[i + xI + 1];
                shot[j + xJ + 2] = inputBuf[i + xI + 2];
                // discard alpha
            }
        }
    }

    HRCHECK(surface->UnlockRect());
    
    HRCHECK(SavePixelsToFile32bppPBGRA());

cleanup:
    
    return hr;
}
#elif DXVERSION == 11

LPBYTE inputBuf = nullptr;

void Direct3D11TakeScreenshots() {


    hrG = duplication->AcquireNextFrame(15, &frame_info, &desktop_resource);

    if (hrG == S_OK) {

        desktop_resource->QueryInterface(__uuidof(ID3D11Texture2D), (void**)&tex);

        m_DeviceContext->CopySubresourceRegion(staging_tex, 0, 0, 0, 0, tex, 0, &cropRect);

        tex->Release();

        m_DeviceContext->Map(staging_tex,          /* Resource */
            0,                    /* Subresource */
            D3D11_MAP_READ,       /* Map type. */
            0,                    /* Map flags. */
            &map);

        inputBuf = (LPBYTE) map.pData;

        {
            int i = 0, j = 0;

            // copy memory 32bpp to 24bpp
            for (int y = 0, i = 0, j = 0; y < (bottom - top); y++, i = y * bytesPerPixel32 * Width, j = y * stride24) {
                for (int x = left, xI = 0, xJ = 0; x < right; x++, xI = xI + bytesPerPixel32, xJ = xJ + bytesPerPixel24) {
                    shot[j + xJ] = inputBuf[i + xI];
                    shot[j + xJ + 1] = inputBuf[i + xI + 1];
                    shot[j + xJ + 2] = inputBuf[i + xI + 2];
                    // discard alpha
                }
            }
        }

        m_DeviceContext->Unmap(staging_tex, 0);

        duplication->ReleaseFrame();

        SavePixels();
    }
}

#endif

int main(int argc, char ** argv)
{
    BOOL coInit = false;

    right = atoi(argv[3]);
    bottom = atoi(argv[4]);
    left = atoi(argv[1]);
    top = atoi(argv[2]);

#if DXVERSION == 9
    // init D3D and get screen size
    d3d = Direct3DCreate9(D3D_SDK_VERSION);
    d3d->GetAdapterDisplayMode(adapter, &mode);

    Height = mode.Height;
    Width = mode.Width;

    parameters.Windowed = TRUE;
    parameters.BackBufferCount = 1;
    parameters.BackBufferHeight = Height;
    parameters.BackBufferWidth = Width;
    parameters.SwapEffect = D3DSWAPEFFECT_DISCARD;
    parameters.hDeviceWindow = NULL;

    // create device & capture surface
    d3d->CreateDevice(adapter, D3DDEVTYPE_HAL, NULL, D3DCREATE_SOFTWARE_VERTEXPROCESSING, &parameters, &device);
    device->CreateOffscreenPlainSurface(Width, Height, D3DFMT_A8R8G8B8, D3DPOOL_SYSTEMMEM, &surface, nullptr);

#elif DXVERSION == 11

    // Driver types supported
    D3D_DRIVER_TYPE DriverTypes[] =
    {
        D3D_DRIVER_TYPE_HARDWARE,
        D3D_DRIVER_TYPE_WARP,
        D3D_DRIVER_TYPE_REFERENCE,
    };
    UINT NumDriverTypes = ARRAYSIZE(DriverTypes);

    // Feature levels supported
    D3D_FEATURE_LEVEL FeatureLevels[] =
    {
        D3D_FEATURE_LEVEL_11_0,
        D3D_FEATURE_LEVEL_10_1,
        D3D_FEATURE_LEVEL_10_0,
        D3D_FEATURE_LEVEL_9_1
    };
    UINT NumFeatureLevels = ARRAYSIZE(FeatureLevels);
    D3D_FEATURE_LEVEL FeatureLevel;

    DWORD createDeviceFlags = 0;

#if _DEBUG == 1
    createDeviceFlags |= D3D11_CREATE_DEVICE_DEBUG;
#endif
        
    for (UINT DriverTypeIndex = 0; DriverTypeIndex < NumDriverTypes; ++DriverTypeIndex)
    {
        hrG = D3D11CreateDevice(nullptr, DriverTypes[DriverTypeIndex], nullptr, createDeviceFlags, FeatureLevels, NumFeatureLevels,
            D3D11_SDK_VERSION, &m_Device, &FeatureLevel, &m_DeviceContext);
        if (SUCCEEDED(hrG))
        {
            // Device creation succeeded, no need to loop anymore
            break;
        }
    }

    m_Device->QueryInterface(__uuidof(IDXGIDevice), reinterpret_cast<void**>(&DxgiDevice));
    DxgiDevice->GetParent(__uuidof(IDXGIAdapter), reinterpret_cast<void**>(&DxgiAdapter));
    DxgiAdapter->GetParent(__uuidof(IDXGIFactory2), reinterpret_cast<void**>(&m_Factory));
    
    DxgiAdapter->EnumOutputs(0, &deviceOutput);
    deviceOutput->QueryInterface(__uuidof(IDXGIOutput1), reinterpret_cast<void**>(&desktopOutput));
    desktopOutput->DuplicateOutput(m_Device, &duplication);
    deviceOutput->GetDesc(&outputDesc);
    duplication->GetDesc(&duplication_desc);

    Width = duplication_desc.ModeDesc.Width;
    Height = duplication_desc.ModeDesc.Height;

    tex_desc.Width = outputDesc.DesktopCoordinates.right;
    tex_desc.Height = outputDesc.DesktopCoordinates.bottom;
    tex_desc.MipLevels = 1;
    tex_desc.ArraySize = 1; /* When using a texture array. */
    tex_desc.Format = DXGI_FORMAT_B8G8R8A8_UNORM; /* This is the default data when using desktop duplication, see https://msdn.microsoft.com/en-us/library/windows/desktop/hh404611(v=vs.85).aspx */
    tex_desc.SampleDesc.Count = 1; /* MultiSampling, we can use 1 as we're just downloading an existing one. */
    tex_desc.SampleDesc.Quality = 0; /* "" */
    tex_desc.Usage = D3D11_USAGE_STAGING;
    tex_desc.BindFlags = 0;
    tex_desc.CPUAccessFlags = D3D11_CPU_ACCESS_READ;
    tex_desc.MiscFlags = 0;

    m_Device->CreateTexture2D(&tex_desc, NULL, &staging_tex);

    staging_tex->SetEvictionPriority(DXGI_RESOURCE_PRIORITY_MAXIMUM);

    cropRect.front = 0;
    cropRect.back = 1;

    SYSTEMTIME time;
    LONG iniFrame = 0;
    LONG endFrame = 0;
#endif

    cropRect.left = left;
    cropRect.top = top;
    cropRect.right = right;
    cropRect.bottom = bottom;

    exportHeight = abs((int) (cropRect.top - cropRect.bottom));
    exportWidth = abs((int) (cropRect.left - cropRect.right));

    pitch = Width * bytesPerPixel32;

    shot = new BYTE[bytesPerPixel24 * exportHeight * exportWidth];

    CoInitialize(nullptr);

    CoCreateInstance(CLSID_WICImagingFactory, nullptr, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&wicImageFactory));
    
    endPixelsBuffer = pitch * bottom;
    startPixelsBuffer = (top * pitch + bytesPerPixel32 * left);
    sizePixelsBuffer = endPixelsBuffer - startPixelsBuffer;

    stride24 = bytesPerPixel24 * exportWidth;
    stride32 = bytesPerPixel32 * exportWidth;

#if _DEBUG == 0
    do {
#endif
#if DXVERSION == 9
        Direct3D9TakeScreenshots();
#elif DXVERSION == 11
        GetSystemTime(&time);
        iniFrame = (time.wSecond * 1000) + time.wMilliseconds;
        Direct3D11TakeScreenshots();
        endFrame = (time.wSecond * 1000) + time.wMilliseconds;
        Sleep(max(TARGET_FRAME_TIME_MS - endFrame + iniFrame, 0));
#endif
#if _DEBUG == 0
#if SAVE_TO_DISK == 1
        Sleep(5000);
#endif
    } while (true);
#endif

cleanup:

    delete[] shot;

#if DXVERSION == 9
    RELEASE(surface);
    RELEASE(device);
    RELEASE(d3d);
#elif DXVERSION == 11
    RELEASE(DxgiDevice);
    RELEASE(m_Factory);
    RELEASE(DxgiAdapter);
    RELEASE(deviceOutput);
    RELEASE(desktopOutput);
    RELEASE(duplication);
    RELEASE(staging_tex);
#endif

    RELEASE(wicImageFactory);
    if (coInit) CoUninitialize();

    return 0;
}